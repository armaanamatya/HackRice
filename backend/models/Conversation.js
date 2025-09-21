const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group', 'broadcast'],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  name: {
    type: String,
    required: function() {
      return this.type === 'group' || this.type === 'broadcast';
    }
  },
  description: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String // URL to group avatar
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  settings: {
    muteNotifications: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      until: Date
    }],
    allowedToPost: {
      type: String,
      enum: ['everyone', 'admins'], // For broadcast channels
      default: 'everyone'
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courseRelated: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    university: String
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    archivedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
conversationSchema.index({ participants: 1, type: 1 });
conversationSchema.index({ 'metadata.university': 1 });
conversationSchema.index({ 'metadata.courseRelated': 1 });
conversationSchema.index({ lastActivity: -1 });

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to check if user is participant
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.toString() === userId.toString());
};

// Method to check if user is admin
conversationSchema.methods.isAdmin = function(userId) {
  return this.admins.some(a => a.toString() === userId.toString());
};

// Method to add participants
conversationSchema.methods.addParticipants = function(userIds) {
  const newParticipants = userIds.filter(userId => 
    !this.participants.some(p => p.toString() === userId.toString())
  );
  this.participants.push(...newParticipants);
  return this.save();
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => 
    p.toString() !== userId.toString()
  );
  // Also remove from admins if they were one
  this.admins = this.admins.filter(a => 
    a.toString() !== userId.toString()
  );
  return this.save();
};

// Method to archive/unarchive for a user
conversationSchema.methods.toggleArchive = function(userId) {
  const archiveIndex = this.archivedBy.findIndex(
    a => a.user.toString() === userId.toString()
  );
  
  if (archiveIndex > -1) {
    this.archivedBy.splice(archiveIndex, 1);
  } else {
    this.archivedBy.push({ user: userId });
  }
  
  return this.save();
};

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirect = async function(user1Id, user2Id) {
  // Sort user IDs to ensure consistent lookup
  const sortedIds = [user1Id, user2Id].sort();
  
  let conversation = await this.findOne({
    type: 'direct',
    participants: { $all: sortedIds, $size: 2 }
  });
  
  if (!conversation) {
    conversation = await this.create({
      type: 'direct',
      participants: sortedIds,
      metadata: {
        createdBy: user1Id
      }
    });
  }
  
  return conversation;
};

// Static method to get user's conversations with pagination
conversationSchema.statics.getUserConversations = async function(userId, options = {}) {
  const { page = 1, limit = 20, type, includeArchived = false } = options;
  const skip = (page - 1) * limit;
  
  const query = {
    participants: userId
  };
  
  if (type) {
    query.type = type;
  }
  
  if (!includeArchived) {
    query.$or = [
      { 'archivedBy.user': { $ne: userId } },
      { archivedBy: { $size: 0 } }
    ];
  }
  
  const conversations = await this.find(query)
    .populate('participants', 'name email profilePicture auth0Id university major year')
    .populate('lastMessage')
    .populate('admins', 'name auth0Id')
    .sort({ lastActivity: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
  
  return conversations;
};

// Pre-save middleware to ensure admins are participants
conversationSchema.pre('save', function(next) {
  // Ensure all admins are participants
  this.admins.forEach(admin => {
    if (!this.participants.some(p => p.toString() === admin.toString())) {
      this.participants.push(admin);
    }
  });
  
  // For new groups/broadcasts, make creator an admin
  if (this.isNew && (this.type === 'group' || this.type === 'broadcast')) {
    if (!this.admins.some(a => a.toString() === this.metadata.createdBy.toString())) {
      this.admins.push(this.metadata.createdBy);
    }
  }
  
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);