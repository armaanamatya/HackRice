import React, { useState, useEffect } from 'react';

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ParsedClassData
 */

/**
 * @typedef {object} ClassDataWithId
 * @property {string} id - Unique ID for the class.
 * @property {string} course - Course name (e.g., "CSC 101").
 * @property {string[]} days - Array of days the class meets (e.g., ["Mon", "Wed"]).
 * @property {string} startTime - Start time of the class (e.g., "09:00").
 * @property {string} endTime - End time of the class (e.g., "09:50").
 * @property {string} [location] - Optional class location.
 */

/**
 * A form component to review and correct parsed schedule data.
 * @param {object} props
 * @param {ParsedClassData[]} props.initialClasses - The array of classes parsed from OCR.
 * @param {function(ClassDataWithId[]): void} props.onScheduleValidated - Callback with the final, validated schedule data.
 * @param {function(): void} props.onBackToUpload - Callback to return to the upload step.
 */
const ScheduleReviewForm = ({ initialClasses, onScheduleValidated, onBackToUpload }) => {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    // Assign unique IDs if not already present and set initial state
    setClasses(initialClasses.map(cls => ({
      ...cls,
      id: cls.id || String(Date.now() + Math.random()),
    })));
  }, [initialClasses]);

  const handleClassChange = (id, field, value) => {
    setClasses(prevClasses =>
      prevClasses.map(cls => (cls.id === id ? { ...cls, [field]: value } : cls))
    );
  };

  const handleRemoveClass = (id) => {
    setClasses(prevClasses => prevClasses.filter(cls => cls.id !== id));
  };

  const handleAddEmptyClass = () => {
    setClasses(prevClasses => [
      ...prevClasses,
      {
        id: String(Date.now() + Math.random()),
        course: '',
        days: [],
        startTime: '',
        endTime: '',
        location: '',
      },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out any classes that are completely empty or invalid before submitting
    const validatedClasses = classes.filter(cls => cls.course && cls.days.length > 0 && cls.startTime && cls.endTime);
    onScheduleValidated(validatedClasses);
  };

  const daysOfWeekOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="schedule-review-form-container">
      <h2>Review and Correct Your Schedule</h2>
      <p>Please review the extracted class data. Make any necessary corrections or add missing classes.</p>

      <form onSubmit={handleSubmit} className="schedule-review-form">
        {classes.length === 0 && <p>No classes found. You can add them manually.</p>}

        {classes.map((cls) => (
          <div key={cls.id} className="class-review-card">
            <div className="form-group">
              <label htmlFor={`course-${cls.id}`}>Course Name</label>
              <input
                type="text"
                id={`course-${cls.id}`}
                value={cls.course}
                onChange={(e) => handleClassChange(cls.id, 'course', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Days</label>
              <div className="days-checkboxes">
                {daysOfWeekOptions.map(day => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      value={day}
                      checked={cls.days.includes(day)}
                      onChange={(e) => {
                        const newDays = e.target.checked
                          ? [...cls.days, day]
                          : cls.days.filter(d => d !== day);
                        handleClassChange(cls.id, 'days', newDays);
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="time-location-group">
              <div className="form-group">
                <label htmlFor={`startTime-${cls.id}`}>Start Time</label>
                <input
                  type="time"
                  id={`startTime-${cls.id}`}
                  value={cls.startTime}
                  onChange={(e) => handleClassChange(cls.id, 'startTime', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor={`endTime-${cls.id}`}>End Time</label>
                <input
                  type="time"
                  id={`endTime-${cls.id}`}
                  value={cls.endTime}
                  onChange={(e) => handleClassChange(cls.id, 'endTime', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor={`location-${cls.id}`}>Location</label>
                <input
                  type="text"
                  id={`location-${cls.id}`}
                  value={cls.location}
                  onChange={(e) => handleClassChange(cls.id, 'location', e.target.value)}
                />
              </div>
            </div>

            <button type="button" onClick={() => handleRemoveClass(cls.id)} className="remove-class-button">Remove Class</button>
          </div>
        ))}

        <div className="form-actions">
          <button type="button" onClick={handleAddEmptyClass} className="add-empty-class-button">Add Empty Class</button>
          <button type="button" onClick={onBackToUpload} className="back-button">Back to Upload</button>
          <button type="submit" className="submit-schedule-button">Confirm Schedule</button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleReviewForm;
