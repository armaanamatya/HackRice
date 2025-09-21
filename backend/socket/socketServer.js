const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Store active connections
const activeUsers = new Map(); // userId -> Set of socket IDs
const socketToUser = new Map(); // socketId -> userId

function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // For now, we'll just extract auth0Id from the token
      // In production, verify with Auth0
      const auth0Id = socket.handshake.auth.userId;
      if (!auth0Id) {
        return next(new Error('Auth0 ID required'));
      }

      // Find the user in database by auth0Id to get the MongoDB _id
      const user = await User.findOne({ auth0Id });
      if (!user) {
        return next(new Error('User not found in database'));
      }

      socket.userId = user._id.toString(); // Use MongoDB ObjectId
      socket.auth0Id = auth0Id; // Keep auth0Id for reference
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected on socket ${socket.id}`);
    
    // Track active users
    if (!activeUsers.has(socket.userId)) {
      activeUsers.set(socket.userId, new Set());
    }
    activeUsers.get(socket.userId).add(socket.id);
    socketToUser.set(socket.id, socket.userId);

    // Join user to their own room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Join user to all their conversation rooms
    try {
      const conversations = await Conversation.find({ participants: socket.userId });
      conversations.forEach(conv => {
        socket.join(`conversation:${conv._id}`);
      });
    } catch (error) {
      console.error('Error joining conversation rooms:', error);
    }

    // Emit online status to friends
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // Handle joining a conversation
    socket.on('conversation:join', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.isParticipant(socket.userId)) {
          socket.join(`conversation:${conversationId}`);
          
          // Load and send recent messages
          const messages = await Message.getConversationMessages(conversationId, {
            page: 1,
            limit: 50,
            userId: socket.userId
          });
          
          socket.emit('conversation:messages', {
            conversationId,
            messages
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle sending a message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text', attachments = [] } = data;
        
        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized to send message' });
        }

        // Check if user can post (for broadcast channels)
        if (conversation.type === 'broadcast' && 
            conversation.settings.allowedToPost === 'admins' && 
            !conversation.isAdmin(socket.userId)) {
          return socket.emit('error', { message: 'Only admins can post in this channel' });
        }

        // Create message
        const message = await Message.create({
          conversationId,
          sender: socket.userId,
          content,
          type,
          attachments,
          readBy: [{ user: socket.userId }]
        });

        // Populate sender info
        await message.populate('sender', 'name email profilePicture auth0Id');

        // Update conversation's last message and activity
        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();
        await conversation.save();

        // Emit to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit('message:new', {
          conversationId,
          message
        });

        // Send push notifications to offline users (implement later)
        // await sendPushNotifications(conversation.participants, message);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        conversationId,
        userId: socket.userId
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user:stopTyping', {
        conversationId,
        userId: socket.userId
      });
    });

    // Handle message editing
    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;
        
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Not authorized to edit message' });
        }

        message.content = content;
        message.editedAt = new Date();
        await message.save();
        
        await message.populate('sender', 'name email profilePicture auth0Id');

        io.to(`conversation:${message.conversationId}`).emit('message:edited', {
          conversationId: message.conversationId,
          message
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Not authorized to delete message' });
        }

        await message.softDelete();

        io.to(`conversation:${message.conversationId}`).emit('message:deleted', {
          conversationId: message.conversationId,
          messageId
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle creating a group
    socket.on('group:create', async (data) => {
      try {
        const { name, description, participantIds } = data;
        
        // Ensure creator is included
        const allParticipants = [...new Set([socket.userId, ...participantIds])];
        
        const conversation = await Conversation.create({
          type: 'group',
          name,
          description,
          participants: allParticipants,
          metadata: {
            createdBy: socket.userId
          }
        });

        await conversation.populate('participants', 'name email profilePicture');

        // Notify all participants
        allParticipants.forEach(userId => {
          io.to(`user:${userId}`).emit('conversation:new', conversation);
        });

        // Join all online participants to the conversation
        allParticipants.forEach(userId => {
          const userSockets = activeUsers.get(userId);
          if (userSockets) {
            userSockets.forEach(socketId => {
              io.sockets.sockets.get(socketId)?.join(`conversation:${conversation._id}`);
            });
          }
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to create group' });
      }
    });

    // Handle adding participants to group
    socket.on('group:addParticipants', async (data) => {
      try {
        const { conversationId, userIds } = data;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || conversation.type !== 'group' || !conversation.isAdmin(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized to add participants' });
        }

        await conversation.addParticipants(userIds);
        await conversation.populate('participants', 'name email profilePicture');

        // Notify all participants about the update
        io.to(`conversation:${conversationId}`).emit('conversation:updated', conversation);

        // Join new participants to the conversation
        userIds.forEach(userId => {
          const userSockets = activeUsers.get(userId);
          if (userSockets) {
            userSockets.forEach(socketId => {
              io.sockets.sockets.get(socketId)?.join(`conversation:${conversationId}`);
            });
          }
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to add participants' });
      }
    });

    // Handle leaving a group
    socket.on('group:leave', async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || conversation.type !== 'group') {
          return socket.emit('error', { message: 'Invalid conversation' });
        }

        await conversation.removeParticipant(socket.userId);
        
        // Leave the socket room
        socket.leave(`conversation:${conversationId}`);
        
        // Notify remaining participants
        io.to(`conversation:${conversationId}`).emit('participant:left', {
          conversationId,
          userId: socket.userId
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to leave group' });
      }
    });

    // Handle marking messages as read
    socket.on('messages:markRead', async (data) => {
      try {
        const { conversationId, messageIds } = data;
        
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            'readBy.user': { $ne: socket.userId }
          },
          {
            $push: { readBy: { user: socket.userId, readAt: new Date() } }
          }
        );

        // Notify sender about read receipt
        io.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          messageIds,
          userId: socket.userId
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Remove from active users
      const userSockets = activeUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUsers.delete(socket.userId);
          // Emit offline status
          socket.broadcast.emit('user:offline', { userId: socket.userId });
        }
      }
      socketToUser.delete(socket.id);
    });
  });

  return io;
}

// Helper function to emit to specific users
function emitToUsers(io, userIds, event, data) {
  userIds.forEach(userId => {
    io.to(`user:${userId}`).emit(event, data);
  });
}

// Helper function to get online users
function getOnlineUsers() {
  return Array.from(activeUsers.keys());
}

module.exports = {
  initializeSocketServer,
  emitToUsers,
  getOnlineUsers
};