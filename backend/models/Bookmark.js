const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course_code: {
    type: String,
    required: true
  },
  university: {
    type: String,
    required: true
  },
  added_date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

// Create compound index to prevent duplicate bookmarks
bookmarkSchema.index({ user_id: 1, course_code: 1, university: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
