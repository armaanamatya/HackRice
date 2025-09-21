const router = require("express").Router();
const CatalogCourse = require("../models/CatalogCourse");

// GET /api/catalog-courses - Get all catalog courses with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const universityFilter = req.query.university; // 'UH', 'Rice', 'UTD', etc.
    const search = req.query.search; // Search term for course code or title

    const query = {};
    if (universityFilter && universityFilter !== 'all') {
      query.university = universityFilter;
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const totalCourses = await CatalogCourse.countDocuments(query);
    const courses = await CatalogCourse.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      courses,
      total: totalCourses,
      page,
      totalPages: Math.ceil(totalCourses / limit),
    });
  } catch (error) {
    console.error("Error fetching catalog courses:", error);
    res.status(500).json({ message: "Error fetching catalog courses", error: error.message });
  }
});

module.exports = router;
