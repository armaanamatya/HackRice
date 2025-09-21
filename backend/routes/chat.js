const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Helper function to get database user ID from Auth0 ID
async function getUserIdFromAuth0(auth0Id) {
  const user = await User.findOne({ auth0Id });
  return user ? user._id : null;
}

// GET /api/chat/conversations - Get user's conversations
router.get('/conversations', async (req, res) => {
  try {
    const auth0Id = req.query.userId; // In production, get from auth token
    const { page = 1, limit = 20, type, includeArchived } = req.query;
    
    if (!auth0Id) {
      return res.status(400).json({ message: 'User ID required' });
    }

    // Convert Auth0 ID to database ID
    const userId = await getUserIdFromAuth0(auth0Id);
    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const conversations = await Conversation.getUserConversations(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      includeArchived: includeArchived === 'true'
    });

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          'readBy.user': { $ne: userId }
        });
        
        return {
          ...conv,
          unreadCount
        };
      })
    );

    res.json({
      conversations: conversationsWithUnread,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// POST /api/chat/conversations - Create a new conversation
router.post('/conversations', async (req, res) => {
  try {
    const { type, participants, name, description, metadata } = req.body;
    const creatorId = req.body.creatorId; // Now expecting database ID directly
    
    if (!creatorId || !type || !participants || participants.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate that creator exists
    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Validate that all participants exist
    const participantIds = [];
    for (const participantId of participants) {
      const participant = await User.findById(participantId);
      if (!participant) {
        return res.status(404).json({ message: `Participant not found: ${participantId}` });
      }
      participantIds.push(participantId);
    }

    // Ensure creator is included in participants
    const allParticipants = [...new Set([creatorId, ...participantIds])];

    // For direct conversations, check if one already exists
    if (type === 'direct') {
      if (allParticipants.length !== 2) {
        return res.status(400).json({ message: 'Direct conversations must have exactly 2 participants' });
      }
      
      const existingConv = await Conversation.findOrCreateDirect(
        allParticipants[0], 
        allParticipants[1]
      );
      
      await existingConv.populate('participants', 'name email profilePicture auth0Id university major year');
      return res.json(existingConv);
    }

    // Create new group/broadcast conversation
    const conversation = await Conversation.create({
      type,
      participants: allParticipants,
      name,
      description,
      metadata: {
        ...metadata,
        createdBy: creatorId
      }
    });

    await conversation.populate('participants', 'name email profilePicture auth0Id university major year');
    
    // Emit to all participants via Socket.io
    const io = req.app.get('io');
    allParticipants.forEach(userId => {
      io.to(`user:${userId}`).emit('conversation:new', conversation);
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// GET /api/chat/conversations/:id - Get conversation details
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId; // In production, get from auth token
    
    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email profilePicture auth0Id university major year')
      .populate('admins', 'name email auth0Id');
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is participant
    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
});

// PATCH /api/chat/conversations/:id - Update conversation
router.patch('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId; // In production, get from auth token
    const { name, description, avatar } = req.body;
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Only admins can update group/broadcast details
    if ((conversation.type === 'group' || conversation.type === 'broadcast') && 
        !conversation.isAdmin(userId)) {
      return res.status(403).json({ message: 'Only admins can update conversation details' });
    }
    
    // Update allowed fields
    if (name !== undefined) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (avatar !== undefined) conversation.avatar = avatar;
    
    await conversation.save();
    await conversation.populate('participants', 'name email profilePicture auth0Id university major year');
    
    // Notify all participants
    const io = req.app.get('io');
    io.to(`conversation:${id}`).emit('conversation:updated', conversation);
    
    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ message: 'Failed to update conversation' });
  }
});

// GET /api/chat/conversations/:id/messages - Get conversation messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId; // In production, get from auth token
    const { page = 1, limit = 50 } = req.query;
    
    // Verify user is participant
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isParticipant(userId)) {
      return res.status(403).json({ message: 'Not authorized to view messages' });
    }
    
    const messages = await Message.getConversationMessages(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      userId
    });
    
    res.json({
      messages,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// POST /api/chat/messages - Send a message (alternative to socket)
router.post('/messages', async (req, res) => {
  try {
    const { conversationId, content, type = 'text', attachments, senderId } = req.body;
    
    // Verify sender is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isParticipant(senderId)) {
      return res.status(403).json({ message: 'Not authorized to send message' });
    }
    
    // Check broadcast permissions
    if (conversation.type === 'broadcast' && 
        conversation.settings.allowedToPost === 'admins' && 
        !conversation.isAdmin(senderId)) {
      return res.status(403).json({ message: 'Only admins can post in this channel' });
    }
    
    // Create message
    const message = await Message.create({
      conversationId,
      sender: senderId,
      content,
      type,
      attachments,
      readBy: [{ user: senderId }]
    });
    
    await message.populate('sender', 'name email profilePicture');
    
    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();
    
    // Emit via Socket.io
    const io = req.app.get('io');
    io.to(`conversation:${conversationId}`).emit('message:new', {
      conversationId,
      message
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// DELETE /api/chat/messages/:id - Delete a message
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId; // In production, get from auth token
    
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only sender can delete
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }
    
    await message.softDelete();
    
    // Emit via Socket.io
    const io = req.app.get('io');
    io.to(`conversation:${message.conversationId}`).emit('message:deleted', {
      conversationId: message.conversationId,
      messageId: id
    });
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// GET /api/chat/users/search - Search users for starting conversations
router.get('/users/search', async (req, res) => {
  try {
    const { query, university, excludeUserId } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    const searchQuery = {
      $or: [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
      ]
    };
    
    if (university) {
      searchQuery.university = university;
    }
    
    if (excludeUserId) {
      // Convert Auth0 ID to database ID for exclusion
      const excludeDbUserId = await getUserIdFromAuth0(excludeUserId);
      if (excludeDbUserId) {
        searchQuery._id = { $ne: excludeDbUserId };
      }
    }
    
    const users = await User.find(searchQuery)
      .select('name email profilePicture university major year auth0Id')
      .limit(limit)
      .lean();
    
    // Map the results to include both database ID and Auth0 ID for frontend compatibility
    const mappedUsers = users.map(user => ({
      _id: user.auth0Id, // Use Auth0 ID as the _id for frontend compatibility
      dbId: user._id, // Include database ID for internal use
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      university: user.university,
      major: user.major,
      year: user.year
    }));
    
    res.json(mappedUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// POST /api/chat/conversations/:id/participants - Add participants to group
router.post('/conversations/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, adminId } = req.body; // In production, get adminId from auth token
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group conversation not found' });
    }
    
    if (!conversation.isAdmin(adminId)) {
      return res.status(403).json({ message: 'Only admins can add participants' });
    }
    
    await conversation.addParticipants(userIds);
    await conversation.populate('participants', 'name email profilePicture auth0Id university major year');
    
    // Notify via Socket.io
    const io = req.app.get('io');
    io.to(`conversation:${id}`).emit('conversation:updated', conversation);
    
    res.json(conversation);
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({ message: 'Failed to add participants' });
  }
});

// DELETE /api/chat/conversations/:id/participants/:userId - Remove participant
router.delete('/conversations/:id/participants/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const adminId = req.query.adminId; // In production, get from auth token
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group conversation not found' });
    }
    
    // User leaving themselves or admin removing someone
    if (userId !== adminId && !conversation.isAdmin(adminId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await conversation.removeParticipant(userId);
    
    // Notify via Socket.io
    const io = req.app.get('io');
    io.to(`conversation:${id}`).emit('participant:left', {
      conversationId: id,
      userId
    });
    
    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Failed to remove participant' });
  }
});

// POST /api/chat/join-course-group - Join or create a course-based group chat
router.post('/join-course-group', async (req, res) => {
  try {
    const { userId, courseCode, courseName, university } = req.body;
    
    if (!userId || !courseCode || !university) {
      return res.status(400).json({ message: 'Missing required fields: userId, courseCode, university' });
    }

    // Convert Auth0 ID to database ID if needed
    let dbUserId = userId;
    if (typeof userId === 'string' && userId.startsWith('auth0|')) {
      const user = await User.findOne({ auth0Id: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      dbUserId = user._id;
    }

    // Validate user exists
    const user = await User.findById(dbUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user's university matches
    if (user.university !== university) {
      return res.status(403).json({ message: 'You can only join groups for your university' });
    }

    // Generate group name and description
    const groupName = `${courseCode} - ${university}`;
    const groupDescription = courseName ? `Group chat for ${courseCode}: ${courseName} at ${university}` : `Group chat for ${courseCode} at ${university}`;

    // Check if a group already exists for this course and university
    let existingConversation = await Conversation.findOne({
      type: 'group',
      'metadata.courseCode': courseCode,
      'metadata.university': university
    });

    if (existingConversation) {
      // Check if user is already a participant
      if (existingConversation.participants.includes(dbUserId)) {
        await existingConversation.populate('participants', 'name email profilePicture auth0Id university major year');
        return res.json({
          message: 'Already a member of this group',
          conversation: existingConversation
        });
      }

      // Add user to existing group
      existingConversation.participants.push(dbUserId);
      await existingConversation.save();
      await existingConversation.populate('participants', 'name email profilePicture auth0Id university major year');

      // Notify existing participants
      const io = req.app.get('io');
      io.to(`conversation:${existingConversation._id}`).emit('participant:joined', {
        conversationId: existingConversation._id,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          auth0Id: user.auth0Id,
          university: user.university,
          major: user.major,
          year: user.year
        }
      });

      return res.json({
        message: 'Successfully joined the group',
        conversation: existingConversation
      });
    }

    // Find other users from the same university for this course
    const UserSchedule = require('../models/UserSchedule');
    const otherStudents = await UserSchedule.find({
      'courses.courseCode': courseCode,
      user_id: { $ne: dbUserId }
    }).populate({
      path: 'user_id',
      match: { university: university },
      select: 'name email profilePicture auth0Id university major year'
    });

    // Filter out null populated users and get user IDs
    const potentialParticipants = otherStudents
      .filter(schedule => schedule.user_id)
      .map(schedule => schedule.user_id._id);

    // Add the requesting user to participants
    const allParticipants = [dbUserId, ...potentialParticipants.slice(0, 19)]; // Limit to 20 total participants

    // Create new group conversation
    const conversation = await Conversation.create({
      type: 'group',
      participants: allParticipants,
      name: groupName,
      description: groupDescription,
      metadata: {
        courseCode: courseCode,
        courseName: courseName,
        university: university,
        createdBy: dbUserId,
        groupType: 'course'
      },
      admins: [dbUserId] // Creator is admin
    });

    await conversation.populate('participants', 'name email profilePicture auth0Id university major year');

    // Notify all participants via Socket.io
    const io = req.app.get('io');
    allParticipants.forEach(participantId => {
      io.to(`user:${participantId}`).emit('conversation:new', conversation);
    });

    res.status(201).json({
      message: 'Successfully created and joined the group',
      conversation: conversation
    });
  } catch (error) {
    console.error('Error joining course group:', error);
    res.status(500).json({ message: 'Failed to join course group' });
  }
});

module.exports = router;