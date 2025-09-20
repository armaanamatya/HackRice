const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { parseScheduleWithGemini } = require("../services/scheduleParser");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "text/calendar", // ICS files
    ];
    
    // Also allow .ics and .icl files by extension
    const allowedExtensions = [".ics", ".icl"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images (PNG, JPEG), PDFs, and calendar files (ICS, ICL) are allowed."));
    }
  },
});

// POST /api/schedule/upload - Upload and parse schedule
router.post("/upload", upload.single("schedule"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("Received file:", req.file.originalname, req.file.mimetype);
    
    // Parse the schedule using Gemini
    const courses = await parseScheduleWithGemini(req.file);
    
    console.log("Parsed courses:", courses);

    res.json({
      message: "Schedule parsed successfully",
      courses: courses,
    });
  } catch (error) {
    console.error("Error processing schedule:", error);
    res.status(500).json({
      message: "Failed to process schedule",
      error: error.message,
    });
  }
});

module.exports = router;