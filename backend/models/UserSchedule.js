const mongoose = require("mongoose");

// Individual course schema (embedded in UserSchedule)
const courseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    required: true,
  },
  courseName: {
    type: String,
    required: false,
  },
  days: [{
    type: String,
    enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  }],
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: false,
  },
  semester: {
    type: String,
    required: false,
  },
  year: {
    type: Number,
    required: false,
  },
}, { _id: false }); // Disable _id for embedded documents

// User schedule schema
const userScheduleSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Each user can have only one schedule document
  },
  courses: [courseSchema], // Array of course objects
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
userScheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index on user_id for fast lookups
userScheduleSchema.index({ user_id: 1 });

module.exports = mongoose.model("UserSchedule", userScheduleSchema);