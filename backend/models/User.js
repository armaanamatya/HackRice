const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  university: {
    type: String,
    required: false,
  },
  age: {
    type: Number,
    required: false,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  year: {
    type: String,
    required: false,
  },
  major: {
    type: String,
    required: false,
  },
  bio: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
