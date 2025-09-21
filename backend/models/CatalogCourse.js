const mongoose = require('mongoose');

const catalogCourseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  department: {
    type: String,
    required: false,
  },
  credit_hours: {
    type: String,
    required: false,
  },
  prerequisites: {
    type: String,
    required: false,
  },
  university: {
    type: String,
    required: true,
    enum: ['UH', 'Rice', 'UTD'], // Add other universities as needed
  },
  // Potentially add more fields like 'semesters_offered', 'core_quisites', etc.
});

// Create a compound index to ensure uniqueness for a course within a university
catalogCourseSchema.index({ code: 1, university: 1 }, { unique: true });

module.exports = mongoose.model('CatalogCourse', catalogCourseSchema);
