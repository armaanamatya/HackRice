const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user
router.post('/', async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email
  });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Sync Auth0 user with MongoDB
router.post('/auth0-sync', async (req, res) => {
  const { name, email, university } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update existing user if name or university changed
      if (user.name !== name || user.university !== university) {
        user.name = name;
        user.university = university;
        // Preserve existing profileCompleted status
        await user.save();
        console.log('Updated existing user:', user.email);
      }
      return res.status(200).json({
        message: 'User already exists',
        user: user,
        isNew: false
      });
    }

    // Create new user
    user = new User({
      name: name || email,
      email: email.toLowerCase(), // Ensure email is always lowercase in DB
      university: university,
      profileCompleted: false, // New users have not completed profile yet
    });

    const savedUser = await user.save();
    console.log('Created new user in MongoDB:', savedUser.email);

    res.status(201).json({
      message: 'User created successfully',
      user: savedUser,
      isNew: true
    });
  } catch (error) {
    console.error('Error syncing Auth0 user:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update user
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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

    const updatedUser = await user.save();
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/complete-profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile fields
    user.name = req.body.name || user.name;
    user.age = req.body.age || user.age;
    user.year = req.body.year || user.year;
    user.major = req.body.major || user.major;
    user.bio = req.body.bio || user.bio;
    user.profileCompleted = true; // Mark profile as completed

    const updatedUser = await user.save();
    res.json({
      message: 'Profile completed successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;