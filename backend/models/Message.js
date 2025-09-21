const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachments: [{
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: Date,
  deletedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual for checking if message is edited
messageSchema.virtual('isEdited').get(function() {
  return !!this.editedAt;
});

// Method to mark message as read by a user
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete a message
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to get messages for a conversation with pagination
messageSchema.statics.getConversationMessages = async function(conversationId, options = {}) {
  const { page = 1, limit = 50, userId } = options;
  const skip = (page - 1) * limit;
  
  const messages = await this.find({ 
    conversationId, 
    isDeleted: false 
  })
  .populate('sender', 'name email profilePicture auth0Id')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .lean();
  
  // Mark messages as read if userId is provided
  if (userId) {
    const unreadMessageIds = messages
      .filter(msg => !msg.readBy.some(r => r.user.toString() === userId.toString()))
      .map(msg => msg._id);
    
    if (unreadMessageIds.length > 0) {
      await this.updateMany(
        { _id: { $in: unreadMessageIds } },
        { $push: { readBy: { user: userId, readAt: new Date() } } }
      );
    }
  }
  
  return messages.reverse(); // Return in chronological order
};

module.exports = mongoose.model('Message', messageSchema);