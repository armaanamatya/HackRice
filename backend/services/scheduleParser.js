const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const ical = require("node-ical");
const fs = require("fs").promises;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseScheduleWithGemini = async (file) => {
  try {
    let textContent = "";
    let useVisionModel = false;
    
    // Process different file types
    if (file.mimetype.startsWith("image/")) {
      // For images, we'll use Gemini's vision model
      useVisionModel = true;
    } else if (file.mimetype === "application/pdf") {
      // Extract text from PDF
      const pdfBuffer = await fs.readFile(file.path);
      const pdfData = await pdfParse(pdfBuffer);
      textContent = pdfData.text;
    } else if (file.originalname.endsWith(".ics") || file.originalname.endsWith(".icl")) {
      // Parse ICS/ICL calendar files
      const fileContent = await fs.readFile(file.path, "utf8");
      const calendarData = ical.parseICS(fileContent);
      
      // Convert calendar events to text format
      textContent = "Calendar Events:\n";
      for (const event of Object.values(calendarData)) {
        if (event.type === "VEVENT") {
          textContent += `Course: ${event.summary}\n`;
          textContent += `Start: ${event.start}\n`;
          textContent += `End: ${event.end}\n`;
          textContent += `Location: ${event.location || "N/A"}\n`;
          if (event.rrule) {
            textContent += `Recurrence: ${JSON.stringify(event.rrule)}\n`;
          }
          textContent += "---\n";
        }
      }
    }

    // Prepare the prompt for Gemini
    const prompt = `
    Extract course/class information from the following schedule and return it as a JSON array.
    Each course should have the following fields:
    - courseCode: The course code (e.g., "CSC 101", "MATH 207")
    - courseName: The full name of the course (if available)
    - days: Array of days the class meets (use: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    - startTime: Start time in 24-hour format (e.g., "09:00")
    - endTime: End time in 24-hour format (e.g., "10:30")
    - location: Class location/room (if available)
    - semester: Semester (if available, e.g., "Fall 2024", "Spring 2025")
    - year: Year as a number (if available)
    
    Important:
    - Convert all times to 24-hour format
    - Standardize day abbreviations to the format specified above
    - If semester/year information isn't available, omit those fields
    - Return ONLY the JSON array, no additional text or formatting
    
    ${textContent ? `Content:\n${textContent}` : ""}
    `;

    let model;
    let result;

    if (useVisionModel) {
      // Use vision model for images
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      // Read image file
      const imageBuffer = await fs.readFile(file.path);
      const base64Image = imageBuffer.toString("base64");
      
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: file.mimetype,
            data: base64Image,
          },
        },
      ]);
    } else {
      // Use text model for other file types
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      result = await model.generateContent(prompt);
    }

    const response = result.response;
    const text = response.text();
    
    // Clean and parse the JSON response
    let cleanedText = text.trim();
    // Remove any markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    
    try {
      const courses = JSON.parse(cleanedText);
      return courses;
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", text);
      throw new Error("Failed to parse course data from AI response");
    }
  } catch (error) {
    console.error("Error in parseScheduleWithGemini:", error);
    throw error;
  } finally {
    // Clean up uploaded file
    if (file.path) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
  }
};

module.exports = {
  parseScheduleWithGemini,
};