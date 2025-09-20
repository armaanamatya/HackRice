const router = require("express").Router();
const Course = require("../models/Course");
const UserSchedule = require("../models/UserSchedule");

// GET /api/courses/exists/:userId - Check if user has a schedule
router.get("/exists/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userSchedule = await UserSchedule.findOne({ user_id: userId }).select('_id');
    
    res.json({ 
      hasSchedule: !!userSchedule,
      scheduleId: userSchedule?._id || null
    });
  } catch (error) {
    console.error("Error checking user schedule:", error);
    res.status(500).json({ message: "Error checking user schedule", error: error.message });
  }
});

// GET /api/courses/:userId - Get all courses for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userSchedule = await UserSchedule.findOne({ user_id: userId });
    
    if (!userSchedule) {
      return res.json({ courses: [] }); // Return empty courses array if no schedule found
    }
    
    res.json({ courses: userSchedule.courses });
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

    // Validate that each course has required fields
    for (const course of courses) {
      if (!course.id || !course.courseCode || !course.startTime || !course.endTime) {
        return res.status(400).json({ 
          message: "Invalid course data: missing required fields (id, courseCode, startTime, endTime)" 
        });
      }
    }

    // Use findOneAndUpdate with upsert to create or update the user's schedule
    const userSchedule = await UserSchedule.findOneAndUpdate(
      { user_id: userId },
      { 
        user_id: userId,
        courses: courses,
        updatedAt: Date.now()
      },
      { 
        new: true, 
        upsert: true, // Create document if it doesn't exist
        runValidators: true 
      }
    );

    res.json({
      message: "Courses saved successfully",
      courses: userSchedule.courses,
    });
  } catch (error) {
    console.error("Error saving courses:", error);
    res.status(500).json({ message: "Error saving courses", error: error.message });
  }
});

// PATCH /api/courses/:userId/:courseId - Update a single course within user's schedule
router.patch("/:userId/:courseId", async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const updates = req.body;

    // Find the user's schedule and update the specific course
    const userSchedule = await UserSchedule.findOne({ user_id: userId });
    
    if (!userSchedule) {
      return res.status(404).json({ message: "User schedule not found" });
    }

    // Find the course to update
    const courseIndex = userSchedule.courses.findIndex(course => course.id === courseId);
    
    if (courseIndex === -1) {
      return res.status(404).json({ message: "Course not found in user's schedule" });
    }

    // Update the course
    Object.assign(userSchedule.courses[courseIndex], updates);
    userSchedule.updatedAt = Date.now();
    
    await userSchedule.save();

    res.json({
      message: "Course updated successfully",
      course: userSchedule.courses[courseIndex]
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Error updating course", error: error.message });
  }
});

// DELETE /api/courses/:userId/:courseId - Delete a course from user's schedule
router.delete("/:userId/:courseId", async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // Find the user's schedule and remove the specific course
    const userSchedule = await UserSchedule.findOne({ user_id: userId });
    
    if (!userSchedule) {
      return res.status(404).json({ message: "User schedule not found" });
    }

    // Find the course to delete
    const courseIndex = userSchedule.courses.findIndex(course => course.id === courseId);
    
    if (courseIndex === -1) {
      return res.status(404).json({ message: "Course not found in user's schedule" });
    }

    // Remove the course from the array
    userSchedule.courses.splice(courseIndex, 1);
    userSchedule.updatedAt = Date.now();
    
    await userSchedule.save();

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course", error: error.message });
  }
});

// DELETE /api/courses/:userId - Delete entire schedule for a user
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await UserSchedule.findOneAndDelete({ user_id: userId });

    if (!result) {
      return res.status(404).json({ message: "User schedule not found" });
    }

    res.json({ message: "User schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting user schedule:", error);
    res.status(500).json({ message: "Error deleting user schedule", error: error.message });
  }
});

module.exports = router;
