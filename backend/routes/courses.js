const router = require("express").Router();
const Course = require("../models/Course");

// GET /api/courses/:userId - Get all courses for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const courses = await Course.find({ userId }).sort({ courseCode: 1 });
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Error fetching courses", error: error.message });
  }
});

// POST /api/courses - Create or update multiple courses for a user
router.post("/", async (req, res) => {
  try {
    const { userId, courses } = req.body;

    if (!userId || !courses || !Array.isArray(courses)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Delete existing courses for the user to avoid duplicates
    await Course.deleteMany({ userId });

    // Create new courses
    const coursesToCreate = courses.map((course) => ({
      ...course,
      userId,
    }));

    const createdCourses = await Course.insertMany(coursesToCreate);

    res.json({
      message: "Courses saved successfully",
      courses: createdCourses,
    });
  } catch (error) {
    console.error("Error saving courses:", error);
    res.status(500).json({ message: "Error saving courses", error: error.message });
  }
});

// PATCH /api/courses/:id - Update a single course
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Error updating course", error: error.message });
  }
});

// DELETE /api/courses/:id - Delete a course
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course", error: error.message });
  }
});

module.exports = router;