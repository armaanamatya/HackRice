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

  try {
    // Load comprehensive UH courses
    const uhComprehensivePath = path.join(__dirname, "../../uh_comprehensive_courses.json");
    if (fs.existsSync(uhComprehensivePath)) {
      try {
        const fileContent = fs.readFileSync(uhComprehensivePath, 'utf8');
        const courses = JSON.parse(fileContent);
        
        courses.forEach(course => {
          allCourses.push({
            ...course,
            university: "University of Houston",
            source: "UH"
          });
        });
        console.log(`Loaded ${courses.length} UH courses from comprehensive file`);
      } catch (error) {
        console.error("Error loading UH comprehensive file:", error);
      }
    }

    // Load comprehensive Rice courses
    const riceComprehensivePath = path.join(__dirname, "../../rice_comprehensive_courses.json");
    if (fs.existsSync(riceComprehensivePath)) {
      try {
        const fileContent = fs.readFileSync(riceComprehensivePath, 'utf8');
        const courses = JSON.parse(fileContent);
        
        courses.forEach(course => {
          allCourses.push({
            ...course,
            university: "Rice University",
            source: "Rice"
          });
        });
        console.log(`Loaded ${courses.length} Rice courses from comprehensive file`);
      } catch (error) {
        console.error("Error loading Rice comprehensive file:", error);
      }
    }

    // Load UTD courses
    const utdPath = path.join(__dirname, "../data/utd");
    if (fs.existsSync(utdPath)) {
      const utdFiles = fs.readdirSync(utdPath).filter(file => file.endsWith('.json'));
      
      for (const file of utdFiles) {
        try {
          const filePath = path.join(utdPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const courses = JSON.parse(fileContent);
          
          courses.forEach(course => {
            allCourses.push({
              ...course,
              university: "UT Dallas",
              source: "UTD"
            });
          });
          console.log(`Loaded UTD courses from ${file}`);
        } catch (error) {
          console.error(`Error loading UTD file ${file}:`, error);
        }
      }
    }

    console.log(`Loaded ${allCourses.length} total courses from catalog`);
    
    // Update cache
    coursesCache = allCourses;
    cacheTimestamp = Date.now();
    
    return allCourses;
  } catch (error) {
    console.error("Error loading course catalog:", error);
    return [];
  }
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
      limit = 50,
      userUniversity // Add userUniversity parameter
    } = req.query;

    console.log("Catalog search request:", req.query);

    const allCourses = await loadAllCourses();
    let filteredCourses = [...allCourses];

    // Apply university filter - prioritize userUniversity over manual university filter
    const targetUniversity = userUniversity || university;
    if (targetUniversity && targetUniversity !== 'all') {
      filteredCourses = filteredCourses.filter(course => 
        course.university === targetUniversity
      );
    }

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
      // First by university
      const uniCompare = (a.university || '').localeCompare(b.university || '');
      if (uniCompare !== 0) return uniCompare;
      
      // Then by department
      const deptCompare = (a.department || '').localeCompare(b.department || '');
      if (deptCompare !== 0) return deptCompare;
      
      // Finally by code
      return (a.code || '').localeCompare(b.code || '');
    });

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    // Get unique values for filters
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