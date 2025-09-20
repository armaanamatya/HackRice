import ICAL from 'ical.js';

/**
 * @typedef {import('./scheduleParser').ParsedClassData} ParsedClassData
 */

/**
 * Parses an ICS file and converts it to the standard ParsedClassData format
 * @param {File} file - The ICS file to parse
 * @returns {Promise<ParsedClassData[]>} Promise that resolves to an array of parsed class objects
 */
export const parseICSFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const icsData = event.target.result;
        const parsedClasses = parseICSData(icsData);
        resolve(parsedClasses);
      } catch (error) {
        console.error('Error parsing ICS file:', error);
        reject(new Error(`Failed to parse ICS file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parses ICS data string and converts events to class schedule format
 * @param {string} icsData - The raw ICS file content
 * @returns {ParsedClassData[]} Array of parsed class objects
 */
export const parseICSData = (icsData) => {
  try {
    // Parse the ICS data
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    const classes = [];
    const classMap = new Map(); // To group recurring events by summary
    
    vevents.forEach((vevent) => {
      try {
        const event = new ICAL.Event(vevent);
        
        // Extract basic event information
        const summary = event.summary || 'Untitled Event';
        const location = event.location || '';
        const startDate = event.startDate?.toJSDate();
        const endDate = event.endDate?.toJSDate();
        
        if (!startDate || !endDate) {
          console.warn('Event missing start or end date:', summary);
          return;
        }
        
        // Extract course code from summary (common patterns)
        const courseMatch = summary.match(/([A-Z]{2,4}\s*\d{2,4}[A-Z]?)/i);
        const course = courseMatch ? courseMatch[1] : summary;
        
        // Convert times to 24-hour format
        const startTime = formatTime(startDate);
        const endTime = formatTime(endDate);
        
        // Get day of week
        const dayOfWeek = getDayFromDate(startDate);
        
        // Group by course to handle recurring events
        const key = `${course}-${startTime}-${endTime}`;
        
        if (classMap.has(key)) {
          // Add day to existing class
          const existingClass = classMap.get(key);
          if (!existingClass.days.includes(dayOfWeek)) {
            existingClass.days.push(dayOfWeek);
          }
        } else {
          // Create new class entry
          const classData = {
            id: `ics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            course: course.trim(),
            days: [dayOfWeek],
            startTime,
            endTime,
            location: location.trim(),
          };
          
          classMap.set(key, classData);
        }
      } catch (eventError) {
        console.warn('Error processing individual event:', eventError);
      }
    });
    
    // Convert map to array and sort days
    classes.push(...Array.from(classMap.values()).map(classData => ({
      ...classData,
      days: sortDays(classData.days),
    })));
    
    return classes;
  } catch (error) {
    console.error('Error parsing ICS data:', error);
    throw new Error(`ICS parsing failed: ${error.message}`);
  }
};

/**
 * Formats a Date object to HH:MM string
 * @param {Date} date - The date to format
 * @returns {string} Time in HH:MM format
 */
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Converts a Date object to day abbreviation
 * @param {Date} date - The date to convert
 * @returns {string} Day abbreviation (Mon, Tue, etc.)
 */
const getDayFromDate = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

/**
 * Sorts days in week order
 * @param {string[]} days - Array of day abbreviations
 * @returns {string[]} Sorted array of days
 */
const sortDays = (days) => {
  const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
};

/**
 * Validates if a file is a supported calendar format
 * @param {File} file - The file to validate
 * @returns {boolean} True if the file is supported
 */
export const isValidCalendarFile = (file) => {
  const supportedExtensions = ['.ics', '.icl', '.ical'];
  const fileName = file.name.toLowerCase();
  return supportedExtensions.some(ext => fileName.endsWith(ext));
};
