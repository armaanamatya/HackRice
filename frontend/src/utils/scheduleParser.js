/**
 * @typedef {object} ParsedClassData
 * @property {string} course - Course name (e.g., "CSC 101").
 * @property {string[]} days - Array of days the class meets (e.g., ["Mon", "Wed"]).
 * @property {string} startTime - Start time of the class (e.g., "09:00").
 * @property {string} endTime - End time of the class (e.g., "09:50").
 * @property {string} [location] - Optional class location.
 */

/**
 * Parses OCR extracted text to find class schedules.
 * This is a highly simplified parser and may need significant adjustments
 * based on the actual format of the schedules being uploaded.
 * It looks for patterns like: COURSE_CODE DAY_ABBR TIME-TIME LOCATION
 * @param {string} text - The raw text extracted from the schedule image by OCR.
 * @returns {ParsedClassData[]} An array of parsed class objects.
 */
export const parseScheduleText = (text) => {
  console.log('=== SCHEDULE PARSER DEBUG ===');
  console.log('Input text for parsing:', text);
  
  const classes = [];
  // Split text into lines to process each potential class entry
  const lines = text.split('\n').filter(line => line.trim() !== '');
  console.log('Non-empty lines to process:', lines);

  const dayMap = {
    'M': 'Mon', 'Mo': 'Mon', 'Mon': 'Mon',
    'T': 'Tue', 'Tu': 'Tue', 'Tue': 'Tue', 'Tues': 'Tue',
    'W': 'Wed', 'We': 'Wed', 'Wed': 'Wed',
    'Th': 'Thu', 'Thu': 'Thu', 'Thurs': 'Thu',
    'F': 'Fri', 'Fr': 'Fri', 'Fri': 'Fri',
    'Sa': 'Sat', 'Sat': 'Sat',
    'Su': 'Sun', 'Sun': 'Sun',
  };

  // Regex to find potential class entries. This is a very basic pattern.
  // It tries to find: COURSE_CODE (e.g., CSC 101), DAYS (e.g., MWF, TuTh), TIMES (e.g., 9:00AM-9:50AM or 09:00-09:50)
  // and an optional LOCATION.
  // This regex is highly simplified and will likely need extensive refinement.
  const classRegex = /(\b[A-Z]{2,4}\s*\d{2,4}[A-Z]?\b)\s*([MTWThFSu]+)\s*(\d{1,2}:\d{2}(?:AM|PM)?\s*[-–]\s*\d{1,2}:\d{2}(?:AM|PM)?)(?:\s+(.*?))?$/i;

  lines.forEach((line, index) => {
    console.log(`Processing line ${index + 1}: "${line}"`);
    const match = line.match(classRegex);
    console.log(`Regex match result:`, match);
    
    if (match) {
      const [, course, daysAbbr, timeRange, location] = match;
      console.log(`✅ Found match - Course: ${course}, Days: ${daysAbbr}, Time: ${timeRange}, Location: ${location || 'N/A'}`);

      // Parse days
      const rawDays = daysAbbr.match(/[A-Z][a-z]*/g) || [];
      const parsedDays = rawDays.map(d => dayMap[d]).filter(Boolean);

      // Parse times
      const [startTimeStr, endTimeStr] = timeRange.split(/[-–]/).map(s => s.trim());

      // Basic time conversion (e.g., 9:00AM -> 09:00, 1:00PM -> 13:00)
      const convertTo24Hour = (time) => {
        let [hour, minute] = time.replace(/(AM|PM)/i, '').split(':');
        hour = parseInt(hour, 10);
        minute = parseInt(minute, 10);
        const isPM = time.toLowerCase().includes('pm');

        if (isPM && hour !== 12) {
          hour += 12;
        } else if (!isPM && hour === 12) {
          hour = 0; // Midnight
        }
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };

      const startTime = convertTo24Hour(startTimeStr);
      const endTime = convertTo24Hour(endTimeStr);

      console.log(`Parsed days: ${parsedDays}, Start time: ${startTime}, End time: ${endTime}`);
      
      if (parsedDays.length > 0) {
        const classObject = {
          id: String(Date.now() + Math.random()), // Unique ID
          course: course.trim(),
          days: parsedDays,
          startTime,
          endTime,
          location: location ? location.trim() : '',
        };
        console.log(`✅ Adding class:`, classObject);
        classes.push(classObject);
      } else {
        console.log(`❌ Skipping line - no valid days parsed`);
      }
    } else {
      console.log(`❌ No regex match for line: "${line}"`);
    }
  });

  console.log(`=== PARSING COMPLETE ===`);
  console.log(`Total classes found: ${classes.length}`);
  return classes;
};
