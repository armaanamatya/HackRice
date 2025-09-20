import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, startOfWeek, addDays, getDay } from 'date-fns';

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

/**
 * Renders an interactive and animated weekly schedule grid.
 * @param {object} props
 * @param {ClassData[]} props.schedule - The array of validated class objects.
 * @param {function(): void} props.onEditSchedule - Callback to go back to editing the schedule.
 * @param {function(ClassData[]): void} props.onImportSchedule - Callback to import a new schedule.
 */
const InteractiveScheduleDisplay = ({ schedule, onEditSchedule, onImportSchedule }) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // Excluding Sat/Sun for typical academic week
  const timeSlots = Array.from({ length: 14 }, (_, i) => `${9 + i}:00`); // 9 AM to 10 PM

  const getCurrentWeek = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday is the first day of the week
    return daysOfWeek.map((_, index) => addDays(start, index));
  };

  const weekDates = getCurrentWeek();

  /**
   * Handles exporting the schedule data as a JSON file.
   */
  const handleExportSchedule = () => {
    const json = JSON.stringify(schedule, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scedulr_schedule.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Handles importing a schedule from a JSON file.
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Basic validation for imported data structure
        if (Array.isArray(importedData) && importedData.every(item => item.course && item.days && item.startTime && item.endTime)) {
          onImportSchedule(importedData);
          alert('Schedule imported successfully!');
        } else {
          alert('Invalid schedule file format.');
        }
      } catch (error) {
        console.error("Error parsing imported schedule:", error);
        alert('Error importing schedule. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  /**
   * Calculates the position and height of a class on the schedule grid.
   * @param {ClassData} classItem
   * @returns {object} Style properties for the class block.
   */
  const getClassPosition = (classItem) => {
    const start = parseISO(`2000-01-01T${classItem.startTime}:00`);
    const end = parseISO(`2000-01-01T${classItem.endTime}:00`);

    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();

    // Assuming each hour takes a certain height (e.g., 60px)
    const pixelsPerHour = 60;
    const topOffset = ((startHour - 9) * pixelsPerHour) + (startMinute / 60) * pixelsPerHour;
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const height = durationHours * pixelsPerHour;

    return {
      top: `${topOffset}px`,
      height: `${height}px`,
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 70%)`, // Random color for each class
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="interactive-schedule-display-container">
      <h2>Your Weekly Schedule</h2>
      <p>Here's your interactive schedule. Click a class for more details!</p>

      <div className="schedule-controls">
        <button onClick={onEditSchedule} className="edit-schedule-button">Edit Schedule</button>
        <button onClick={handleExportSchedule} className="export-schedule-button">Export Schedule</button>
        <input
          type="file"
          id="importScheduleFile"
          accept="application/json"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
        <label htmlFor="importScheduleFile" className="import-schedule-button">
          Import Schedule
        </label>
      </div>

      <motion.div
        className="schedule-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="time-column-header"></div> {/* Empty corner for alignment */}
        {weekDates.map((date) => (
          <div key={format(date, 'yyyy-MM-dd')} className="day-header">
            {format(date, 'EEE d/MMM')}
          </div>
        ))}

        {timeSlots.map((time, index) => (
          <React.Fragment key={time}>
            <div className="time-slot-label">{time}</div>
            {weekDates.map((date) => (
              <div key={`${format(date, 'yyyy-MM-dd')}-${time}`} className="grid-cell">
                {schedule
                  .filter(cls => cls.days.includes(format(date, 'EEE')) &&
                                 cls.startTime < time && // Class starts before or at this time slot
                                 cls.endTime > time)    // Class ends after this time slot
                  .map((classItem) => (
                    <motion.div
                      key={classItem.id}
                      className="schedule-class-block"
                      style={getClassPosition(classItem)}
                      variants={itemVariants}
                      whileHover={{ scale: 1.03, zIndex: 10 }}
                      initial="hidden"
                      animate="visible"
                    >
                      <p className="class-block-name">{classItem.course}</p>
                      <p className="class-block-time">{classItem.startTime} - {classItem.endTime}</p>
                      {classItem.location && <p className="class-block-location">{classItem.location}</p>}
                    </motion.div>
                  ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export default InteractiveScheduleDisplay;
