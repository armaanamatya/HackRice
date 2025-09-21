const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// Cache for storing all course data
let coursesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Function to load and parse all course data
async function loadAllCourses() {
  // Check if we have valid cached data
  if (coursesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return coursesCache;
  }

  console.log("Loading course catalog data...");
  const allCourses = [];

  // Load UH JSON files
  const uhDataPath = path.join(__dirname, "../data/UH");
  const riceDataPath = path.join(__dirname, "../data/rice");

  try {
    // Load UH courses (JSON format)
    if (fs.existsSync(uhDataPath)) {
      const uhFiles = fs.readdirSync(uhDataPath).filter(file => file.endsWith('.json'));
      
      for (const file of uhFiles) {
        try {
          const filePath = path.join(uhDataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const courses = JSON.parse(fileContent);
          
          courses.forEach(course => {
            allCourses.push({
              ...course,
              university: "University of Houston",
              source: "UH"
            });
          });
        } catch (error) {
          console.error(`Error loading UH file ${file}:`, error);
        }
      }
    }

    // Load Rice courses (CSV format)
    if (fs.existsSync(riceDataPath)) {
      const riceFiles = fs.readdirSync(riceDataPath).filter(file => file.endsWith('.csv'));
      
      for (const file of riceFiles) {
        try {
          const filePath = path.join(riceDataPath, file);
          const courses = await parseCsvFile(filePath);
          
          courses.forEach(course => {
            allCourses.push({
              ...course,
              university: "Rice University",
              source: "Rice"
            });
          });
        } catch (error) {
          console.error(`Error loading Rice file ${file}:`, error);
        }
      }
    }

    console.log(`Loaded ${allCourses.length} courses from catalog`);
    
    // Update cache
    coursesCache = allCourses;
    cacheTimestamp = Date.now();
    
    return allCourses;
  } catch (error) {
    console.error("Error loading course catalog:", error);
    return [];
  }
}

// Helper function to parse CSV files
function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const courses = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => courses.push(data))
      .on('end', () => resolve(courses))
      .on('error', reject);
  });
}

// GET /api/catalog - Get all courses with optional search and filters
router.get("/", async (req, res) => {
  try {
    const { 
      search, 
      department, 
      university, 
      credit_hours, 
      level,
      page = 1, 
      limit = 50 
    } = req.query;

    console.log("Catalog search request:", req.query);

    const allCourses = await loadAllCourses();
    let filteredCourses = [...allCourses];

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filteredCourses = filteredCourses.filter(course => 
        course.title?.toLowerCase().includes(searchTerm) ||
        course.code?.toLowerCase().includes(searchTerm) ||
        course.description?.toLowerCase().includes(searchTerm) ||
        course.department?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply department filter
    if (department && department !== 'all') {
      filteredCourses = filteredCourses.filter(course => 
        course.department?.toLowerCase() === department.toLowerCase()
      );
    }

    // Apply university filter
    if (university && university !== 'all') {
      filteredCourses = filteredCourses.filter(course => 
        course.university === university
      );
    }

    // Apply credit hours filter
    if (credit_hours && credit_hours !== 'all') {
      filteredCourses = filteredCourses.filter(course => 
        course.credit_hours === credit_hours
      );
    }

    // Apply level filter (based on course code number)
    if (level && level !== 'all') {
      filteredCourses = filteredCourses.filter(course => {
        const courseNumber = course.code?.match(/\d+/)?.[0];
        if (!courseNumber) return false;
        
        const num = parseInt(courseNumber);
        switch (level) {
          case 'undergraduate':
            return num < 5000;
          case 'graduate':
            return num >= 5000;
          case 'freshman':
            return num >= 1000 && num < 2000;
          case 'sophomore':
            return num >= 2000 && num < 3000;
          case 'junior':
            return num >= 3000 && num < 4000;
          case 'senior':
            return num >= 4000 && num < 5000;
          default:
            return true;
        }
      });
    }

    // Sort courses
    filteredCourses.sort((a, b) => {
      // First by department, then by code
      const deptCompare = (a.department || '').localeCompare(b.department || '');
      if (deptCompare !== 0) return deptCompare;
      return (a.code || '').localeCompare(b.code || '');
    });

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    // Get unique departments for filter options
    const departments = [...new Set(allCourses.map(course => course.department))].sort();
    const universities = [...new Set(allCourses.map(course => course.university))].sort();
    const creditHours = [...new Set(allCourses.map(course => course.credit_hours))].sort((a, b) => parseInt(a) - parseInt(b));

    res.json({
      courses: paginatedCourses,
      total: filteredCourses.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filteredCourses.length / parseInt(limit)),
      filters: {
        departments,
        universities,
        creditHours
      }
    });

  } catch (error) {
    console.error("Error fetching course catalog:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/catalog/:code - Get specific course by code
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const allCourses = await loadAllCourses();
    
    const course = allCourses.find(c => 
      c.code?.toLowerCase() === code.toLowerCase()
    );
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;