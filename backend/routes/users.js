const express = require("express");
const router = express.Router();
const User = require("../models/User");
const UserSchedule = require("../models/UserSchedule"); // Added import for UserSchedule
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper function to check if a string is an email
const isEmail = (text) => /^[\w-.]+@[\w-.]+\.[\w-.]+$/.test(text);

// Helper function to determine university from email
const getUniversityFromEmail = (email) => {
  if (!email) return "Other";
  const domain = email.split("@")[1];
  switch (domain) {
    case 'rice.edu':
      return 'Rice University';
    case 'utd.edu':
    case 'utdallas.edu':
      return 'University of Texas at Dallas';
    case 'uh.edu':
    case 'cougarnet.uh.edu':
      return 'University of Houston';
    // Add more cases for other universities if needed
    default:
      return 'Other';
  }
};

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${fileExtension}`);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Health check / test route
router.get("/health", (req, res) => {
  res.json({ status: "Users API is working!", timestamp: new Date().toISOString() });
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search users by name and optionally by university (must be before /:id route)
router.get("/search", async (req, res) => {
  try {
    console.log('Search request received:', req.query);
    const { name, university, userUniversity } = req.query;
    const query = {};

    // Must have at least a name to search
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Name parameter is required" });
    }

    if (name) {
      // Search in name, email, and major fields
      query.$or = [
        { name: { $regex: name.trim(), $options: "i" } },
        { email: { $regex: name.trim(), $options: "i" } },
        { major: { $regex: name.trim(), $options: "i" } }
      ];
    }

    // Apply university filter - prioritize userUniversity (automatic) over manual university filter
    const targetUniversity = userUniversity || university;
    if (targetUniversity && targetUniversity !== 'Other') {
      query.university = targetUniversity;
    }

    console.log('Search query:', query);
    const users = await User.find(query)
      .select('-password -__v') // Exclude password and version key from results
      .limit(20) // Limit results for performance
      .sort({ name: 1 }); // Sort by name alphabetically
    console.log(`Found ${users.length} users matching search criteria`);
    
    // Map the results to include auth0Id as _id for frontend compatibility
    const mappedUsers = users.map(user => ({
      _id: user.auth0Id, // Use auth0Id as the _id for frontend compatibility
      dbId: user._id, // Include database ID for internal use
      name: user.name,
      email: user.email,
      university: user.university,
      major: user.major,
      year: user.year,
      bio: user.bio,
      profileCompleted: user.profileCompleted,
      profilePicture: user.profilePicture
    }));
    
    res.json(mappedUsers);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single user by Auth0 ID
router.get("/:id", async (req, res) => {
  try {
    // First try to find by auth0Id (for frontend compatibility)
    let user = await User.findOne({ auth0Id: req.params.id });
    
    // If not found by auth0Id, try by MongoDB _id (for backward compatibility)
    if (!user) {
      user = await User.findById(req.params.id);
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user
router.post("/", async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
  });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Sync Auth0 user with MongoDB
router.post("/auth0-sync", async (req, res) => {
  const { auth0Id, name, email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!auth0Id) {
    return res.status(400).json({ message: "Auth0 ID is required" });
  }

  try {
    // Check if user already exists (by email or auth0Id)
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { auth0Id: auth0Id }
      ]
    });

    if (user) {
      // Update existing user if needed
      let updated = false;
      
      // Update auth0Id if missing
      if (!user.auth0Id) {
        user.auth0Id = auth0Id;
        updated = true;
      }
      
      // Only update name from Auth0 if profile is not completed or if the existing name is still an email
      if (!user.profileCompleted && (user.name !== name || isEmail(user.name))) {
        user.name = name;
        updated = true;
      }
      
      if (user.university !== getUniversityFromEmail(email)) {
        user.university = getUniversityFromEmail(email);
        updated = true;
      }
      
      if (updated) {
        await user.save();
        console.log("Updated existing user:", user.email);
      }
      
      return res.status(200).json({
        message: "User already exists",
        user: user,
        isNew: false,
      });
    }

    // Create new user
    user = new User({
      auth0Id: auth0Id,
      name: name || "", // Use name from Auth0, fallback to an empty string
      email: email.toLowerCase(), // Ensure email is always lowercase in DB
      university: getUniversityFromEmail(email),
      profileCompleted: false, // New users have not completed profile yet
    });

    const savedUser = await user.save();
    console.log("Created new user in MongoDB:", savedUser.email);

    res.status(201).json({
      message: "User created successfully",
      user: savedUser,
      isNew: true,
    });
  } catch (error) {
    console.error("Error syncing Auth0 user:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update user
router.patch("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name != null) {
      user.name = req.body.name;
    }
    if (req.body.email != null) {
      user.email = req.body.email;
    }
    if (req.body.age != null) {
      user.age = req.body.age;
    }
    if (req.body.year != null) {
      user.year = req.body.year;
    }
    if (req.body.major != null) {
      user.major = req.body.major;
    }
    if (req.body.bio != null) {
      user.bio = req.body.bio;
    }
    if (req.body.profileCompleted != null) {
      user.profileCompleted = req.body.profileCompleted;
    }
    if (req.body.interests != null) {
      user.interests = req.body.interests;
    }

    const updatedUser = await user.save();
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/complete-profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update profile fields
    user.name = req.body.name || user.name;
    user.age = req.body.age || user.age;
    user.year = req.body.year || user.year;
    user.major = req.body.major || user.major;
    user.bio = req.body.bio || user.bio;
    user.email = req.body.email || user.email; // Add this line to update email
    user.university = getUniversityFromEmail(user.email); // Auto-detect and set university
    user.profileCompleted = true; // Mark profile as completed

    const updatedUser = await user.save();
    res.json({
      message: "Profile completed successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// New API endpoint for class-based matching
router.get("/match-by-classes/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { major, year, interests } = req.query; // Remove university from filters

    // 1. Retrieve Current User's Schedule
    const currentUserScheduleDoc = await UserSchedule.findOne({ user_id: userId });

    if (!currentUserScheduleDoc || currentUserScheduleDoc.courses.length === 0) {
      return res.status(404).json({ message: "Current user has no schedule uploaded." });
    }

    const currentUserCourses = currentUserScheduleDoc.courses;

    // Get the current user's university
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }
    const currentUserUniversity = currentUser.university;

    // Build query for other users based on filters
    const userFilterQuery = { _id: { $ne: userId } };
    // Implicitly filter by the current user's university
    if (currentUserUniversity && currentUserUniversity !== 'Other') {
      userFilterQuery.university = currentUserUniversity;
    }
    if (major) {
      userFilterQuery.major = major;
    }
    if (year) {
      userFilterQuery.year = year;
    }
    if (interests) {
      // Assuming interests is a comma-separated string
      const interestArray = interests.split(',').map(item => item.trim());
      userFilterQuery.interests = { $in: interestArray };
    }

    // 2. Find Other Users with Schedules and their User details, applying filters
    const otherUserSchedules = await UserSchedule.find({ user_id: { $ne: userId } }).populate({
      path: 'user_id',
      match: userFilterQuery, // Apply filters here
      select: 'name email major year interests profilePicture' // Select interests and profilePicture fields
    });

    let matchedStudents = [];

    for (const otherScheduleDoc of otherUserSchedules) {
      // Only consider users that passed the populate match filter
      if (!otherScheduleDoc.user_id) continue;

      const otherUserCourses = otherScheduleDoc.courses;
      let commonClassesCount = 0;
      let commonClassesDetails = [];

      currentUserCourses.forEach(currentUserCourse => {
        otherUserCourses.forEach(otherUserCourse => {
          // Check for common classes based on course code, days, start and end times
          const isCourseCodeMatch = currentUserCourse.courseCode === otherUserCourse.courseCode;
          const isDayMatch = currentUserCourse.days.some(day => otherUserCourse.days.includes(day));
          // Assuming time comparison needs to be exact for simplicity or define an overlap function
          const isTimeMatch = currentUserCourse.startTime === otherUserCourse.startTime && currentUserCourse.endTime === otherUserCourse.endTime;

          if (isCourseCodeMatch && isDayMatch && isTimeMatch) {
            commonClassesCount++;
            commonClassesDetails.push({
              courseCode: currentUserCourse.courseCode,
              courseName: currentUserCourse.courseName,
            });
          }
        });
      });

      if (commonClassesCount > 0) {
        matchedStudents.push({
          _id: otherScheduleDoc.user_id._id,
          name: otherScheduleDoc.user_id.name,
          email: otherScheduleDoc.user_id.email,
          major: otherScheduleDoc.user_id.major,
          year: otherScheduleDoc.user_id.year,
          interests: otherScheduleDoc.user_id.interests,
          profilePicture: otherScheduleDoc.user_id.profilePicture,
          commonClassesCount: commonClassesCount,
          commonClasses: commonClassesDetails,
        });
      }
    }

    // 4. Order by Common Classes (most common first)
    matchedStudents.sort((a, b) => b.commonClassesCount - a.commonClassesCount);

    res.json(matchedStudents);
  } catch (error) {
    console.error("Error matching users by classes:", error);
    res.status(500).json({ message: "Error matching users by classes", error: error.message });
  }
});

// Upload profile picture
router.post("/upload-profile-picture/:userId", upload.single('profilePicture'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      // If file was uploaded but user not found, clean up the file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      const oldImagePath = path.join(__dirname, '../uploads/profile-pictures', path.basename(user.profilePicture));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user with new profile picture path
    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
    user.profilePicture = profilePictureUrl;
    await user.save();

    res.json({
      message: "Profile picture uploaded successfully",
      profilePicture: profilePictureUrl,
      user: user
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Error uploading profile picture", error: error.message });
  }
});

// Delete profile picture
router.delete("/delete-profile-picture/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the profile picture file if it exists
    if (user.profilePicture) {
      const imagePath = path.join(__dirname, '../uploads/profile-pictures', path.basename(user.profilePicture));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove profile picture from user record
    user.profilePicture = null;
    await user.save();

    res.json({
      message: "Profile picture deleted successfully",
      user: user
    });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    res.status(500).json({ message: "Error deleting profile picture", error: error.message });
  }
});

module.exports = router;
