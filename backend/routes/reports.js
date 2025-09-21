const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const fs = require('fs').promises;
const path = require('path');

// Cache for storing generated reports
const reportsCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Directory for persistent report storage
const REPORTS_DIR = path.join(__dirname, '../data/reports');

// Ensure reports directory exists
async function ensureReportsDirectory() {
  try {
    await fs.access(REPORTS_DIR);
  } catch {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  }
}

// Generate cache key for a course
function generateCacheKey(course) {
  return `${course.university}-${course.code}-${course.title}`.replace(/[^a-zA-Z0-9]/g, '_');
}

// Load cached report from file system
async function loadCachedReport(cacheKey) {
  try {
    const reportPath = path.join(REPORTS_DIR, `${cacheKey}.json`);
    const reportData = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(reportData);
    
    // Check if report is still fresh (within cache duration)
    const generatedAt = new Date(report.metadata?.generatedAt);
    const now = new Date();
    const age = now - generatedAt;
    
    if (age < CACHE_DURATION) {
      return report;
    }
    
    // Report is stale, delete it
    await fs.unlink(reportPath);
    return null;
  } catch (error) {
    return null; // Report not found or invalid
  }
}

// Save report to file system
async function saveCachedReport(cacheKey, report) {
  try {
    await ensureReportsDirectory();
    const reportPath = path.join(REPORTS_DIR, `${cacheKey}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Error saving cached report:', error);
  }
}

// GET /api/reports/test - Test Gemini API connection
router.get('/test', async (req, res) => {
  try {
    const testCourse = {
      code: 'TEST101',
      title: 'Test Course',
      university: 'Test University',
      department: 'Test Department',
      description: 'A simple test course for API verification',
      credit_hours: '3'
    };
    
    console.log('Testing Gemini API with fallback report...');
    
    // Test with fallback report first to verify the system works
    const fallbackReport = geminiService.generateFallbackReport(testCourse);
    
    res.json({
      status: 'success',
      message: 'Report generation system is working (using fallback)',
      testResult: fallbackReport,
      note: 'This is a fallback report. Try generating a real course report to test Gemini API.'
    });
    
  } catch (error) {
    console.error('Report system test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Report system test failed',
      error: error.message
    });
  }
});

// GET /api/reports/:courseCode - Get or generate a course report
router.get('/:courseCode', async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { university, force = false } = req.query;
    
    console.log(`Report request for course: ${courseCode}, university: ${university}`);
    
    // First, get the course data from catalog
    const catalogResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/catalog`);
    const catalogData = await catalogResponse.json();
    
    // Find the specific course
    const course = catalogData.courses?.find(c => 
      c.code?.toLowerCase() === courseCode.toLowerCase() && 
      (!university || c.university === university)
    );
    
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found in catalog',
        courseCode,
        university 
      });
    }
    
    const cacheKey = generateCacheKey(course);
    
    // Check cache first (unless force refresh is requested)
    if (!force) {
      // Check in-memory cache
      if (reportsCache.has(cacheKey)) {
        const cached = reportsCache.get(cacheKey);
        const age = Date.now() - cached.timestamp;
        
        if (age < CACHE_DURATION) {
          console.log('Serving report from memory cache');
          return res.json({ 
            ...cached.report, 
            cached: true, 
            cacheAge: Math.round(age / 1000 / 60) // age in minutes
          });
        } else {
          reportsCache.delete(cacheKey); // Remove stale cache
        }
      }
      
      // Check file system cache
      const cachedReport = await loadCachedReport(cacheKey);
      if (cachedReport) {
        console.log('Serving report from file cache');
        // Also store in memory for faster access
        reportsCache.set(cacheKey, {
          report: cachedReport,
          timestamp: new Date(cachedReport.metadata.generatedAt).getTime()
        });
        
        return res.json({ 
          ...cachedReport, 
          cached: true,
          cacheAge: Math.round((Date.now() - new Date(cachedReport.metadata.generatedAt).getTime()) / 1000 / 60)
        });
      }
    }
    
    // Generate new report
    console.log('Generating new course report...');
    const report = await geminiService.generateCourseReport(course);
    
    // Cache the report
    reportsCache.set(cacheKey, {
      report,
      timestamp: Date.now()
    });
    
    // Save to file system
    await saveCachedReport(cacheKey, report);
    
    console.log('Report generated and cached successfully');
    res.json({ ...report, cached: false });
    
  } catch (error) {
    console.error('Error generating course report:', error);
    res.status(500).json({ 
      message: 'Failed to generate course report',
      error: error.message 
    });
  }
});

// GET /api/reports/:courseCode/quick - Get or generate a quick course summary
router.get('/:courseCode/quick', async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { university } = req.query;
    
    console.log(`Quick summary request for course: ${courseCode}`);
    
    // Get course data from catalog
    const catalogResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/catalog`);
    const catalogData = await catalogResponse.json();
    
    const course = catalogData.courses?.find(c => 
      c.code?.toLowerCase() === courseCode.toLowerCase() && 
      (!university || c.university === university)
    );
    
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found in catalog',
        courseCode,
        university 
      });
    }
    
    const quickSummary = await geminiService.generateQuickSummary(course);
    
    res.json({
      courseCode: course.code,
      courseName: course.title,
      university: course.university,
      ...quickSummary,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating quick summary:', error);
    res.status(500).json({ 
      message: 'Failed to generate quick summary',
      error: error.message 
    });
  }
});

// POST /api/reports/batch - Generate reports for multiple courses
router.post('/batch', async (req, res) => {
  try {
    const { courseCodes, university } = req.body;
    
    if (!Array.isArray(courseCodes) || courseCodes.length === 0) {
      return res.status(400).json({ message: 'courseCodes array is required' });
    }
    
    if (courseCodes.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 courses per batch request' });
    }
    
    console.log(`Batch report request for ${courseCodes.length} courses`);
    
    // Get course data from catalog
    const catalogResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/catalog`);
    const catalogData = await catalogResponse.json();
    
    const results = [];
    const errors = [];
    
    for (const courseCode of courseCodes) {
      try {
        const course = catalogData.courses?.find(c => 
          c.code?.toLowerCase() === courseCode.toLowerCase() && 
          (!university || c.university === university)
        );
        
        if (!course) {
          errors.push({ courseCode, error: 'Course not found in catalog' });
          continue;
        }
        
        const cacheKey = generateCacheKey(course);
        
        // Check cache
        let report = null;
        if (reportsCache.has(cacheKey)) {
          const cached = reportsCache.get(cacheKey);
          const age = Date.now() - cached.timestamp;
          
          if (age < CACHE_DURATION) {
            report = { ...cached.report, cached: true };
          }
        }
        
        if (!report) {
          const cachedReport = await loadCachedReport(cacheKey);
          if (cachedReport) {
            report = { ...cachedReport, cached: true };
            reportsCache.set(cacheKey, {
              report: cachedReport,
              timestamp: new Date(cachedReport.metadata.generatedAt).getTime()
            });
          }
        }
        
        if (!report) {
          // Generate new report
          report = await geminiService.generateCourseReport(course);
          report.cached = false;
          
          // Cache it
          reportsCache.set(cacheKey, {
            report,
            timestamp: Date.now()
          });
          
          await saveCachedReport(cacheKey, report);
        }
        
        results.push(report);
        
      } catch (error) {
        console.error(`Error processing course ${courseCode}:`, error);
        errors.push({ courseCode, error: error.message });
      }
    }
    
    res.json({
      results,
      errors,
      total: courseCodes.length,
      successful: results.length,
      failed: errors.length
    });
    
  } catch (error) {
    console.error('Error in batch report generation:', error);
    res.status(500).json({ 
      message: 'Failed to process batch report request',
      error: error.message 
    });
  }
});

// DELETE /api/reports/cache/:courseCode - Clear cache for a specific course
router.delete('/cache/:courseCode', async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { university } = req.query;
    
    // We need course info to generate cache key
    const catalogResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/catalog`);
    const catalogData = await catalogResponse.json();
    
    const course = catalogData.courses?.find(c => 
      c.code?.toLowerCase() === courseCode.toLowerCase() && 
      (!university || c.university === university)
    );
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const cacheKey = generateCacheKey(course);
    
    // Remove from memory cache
    reportsCache.delete(cacheKey);
    
    // Remove from file system
    try {
      const reportPath = path.join(REPORTS_DIR, `${cacheKey}.json`);
      await fs.unlink(reportPath);
    } catch (error) {
      // File might not exist, that's ok
    }
    
    res.json({ message: 'Cache cleared successfully', courseCode, cacheKey });
    
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      message: 'Failed to clear cache',
      error: error.message 
    });
  }
});


// GET /api/reports/cache/status - Get cache statistics
router.get('/cache/status', async (req, res) => {
  try {
    await ensureReportsDirectory();
    const files = await fs.readdir(REPORTS_DIR);
    const reportFiles = files.filter(f => f.endsWith('.json'));
    
    res.json({
      memoryCache: {
        size: reportsCache.size,
        keys: Array.from(reportsCache.keys())
      },
      fileCache: {
        size: reportFiles.length,
        files: reportFiles
      },
      cacheDuration: CACHE_DURATION / 1000 / 60 / 60 + ' hours'
    });
    
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({ 
      message: 'Failed to get cache status',
      error: error.message 
    });
  }
});

module.exports = router;