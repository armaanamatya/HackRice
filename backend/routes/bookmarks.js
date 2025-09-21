const router = require('express').Router();
const Bookmark = require('../models/Bookmark');

// GET /api/bookmarks/:userId - Get all bookmarks for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookmarks = await Bookmark.find({ user_id: userId }).sort('-added_date');
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/bookmarks - Add a new bookmark
router.post('/', async (req, res) => {
  try {
    const { userId, courseCode, university, notes } = req.body;
    
    const bookmark = new Bookmark({
      user_id: userId,
      course_code: courseCode,
      university,
      notes
    });

    await bookmark.save();
    res.status(201).json(bookmark);
  } catch (error) {
    // Handle duplicate bookmark error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course already bookmarked' });
    }
    console.error('Error creating bookmark:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/bookmarks/:userId/:courseCode/:university - Remove a bookmark
router.delete('/:userId/:courseCode/:university', async (req, res) => {
  try {
    const { userId, courseCode, university } = req.params;
    
    const result = await Bookmark.findOneAndDelete({
      user_id: userId,
      course_code: courseCode,
      university
    });

    if (!result) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/bookmarks/:userId/:courseCode/:university - Update bookmark notes
router.patch('/:userId/:courseCode/:university', async (req, res) => {
  try {
    const { userId, courseCode, university } = req.params;
    const { notes } = req.body;
    
    const bookmark = await Bookmark.findOneAndUpdate(
      {
        user_id: userId,
        course_code: courseCode,
        university
      },
      { notes },
      { new: true }
    );

    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.json(bookmark);
  } catch (error) {
    console.error('Error updating bookmark:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
