const express = require("express");
const router = express.Router();
const User = require("../models/User");

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
    const { name, university } = req.query;
    const query = {};

    // Must have at least a name to search
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Name parameter is required" });
    }

    if (name) {
      query.name = { $regex: name.trim(), $options: "i" }; // Case-insensitive search
    }

    if (university && university !== 'Other') {
      query.university = university;
    }

    console.log('Search query:', query);
    const users = await User.find(query).select('-password -__v'); // Exclude password and version key from results
    console.log(`Found ${users.length} users matching search criteria`);
    
    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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
  const { name, email } = req.body; // Remove university from destructuring

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update existing user if name or university changed
      // Only update name from Auth0 if profile is not completed or if the existing name is still an email (meaning it hasn't been set by the user)
      if (!user.profileCompleted && (user.name !== name || isEmail(user.name))) {
        user.name = name; // Update name from Auth0 if profile not completed or name is still an email
      }
      if (user.university !== getUniversityFromEmail(email)) {
        user.university = getUniversityFromEmail(email);
      }
      // Preserve existing profileCompleted status
      await user.save();
      console.log("Updated existing user:", user.email);
      return res.status(200).json({
        message: "User already exists",
        user: user,
        isNew: false,
      });
    }

    // Create new user
    user = new User({
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


module.exports = router;
