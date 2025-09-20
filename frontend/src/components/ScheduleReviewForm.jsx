import React, { useState, useEffect } from 'react';

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ParsedClassData
 */

/**
 * @typedef {object} ClassDataWithId
 * @property {string} id - Unique ID for the class.
 * @property {string} courseCode - Course name (e.g., "CSC 101").
 * @property {string[]} days - Array of days the class meets (e.g., ["Mon", "Wed"]).
 * @property {string} startTime - Start time of the class (e.g., "09:00").
 * @property {string} endTime - End time of the class (e.g., "09:50").
 * @property {string} [location] - Optional class location.
 */

// --- Helper Icons for better UI ---
const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);


const ScheduleReviewForm = ({ initialClasses, onScheduleValidated, onBackToUpload }) => {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
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
        courseCode: '',
        days: [],
        startTime: '',
        endTime: '',
        location: '',
      },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validatedClasses = classes.filter(cls => cls.courseCode && cls.days.length > 0 && cls.startTime && cls.endTime);
    onScheduleValidated(validatedClasses);
  };

  const daysOfWeekOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="modern-schedule-review">
      {/* Header Section */}
      <div className="review-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text">Schedule Review</span>
          </div>
          <h1 className="hero-title">Review & Edit Your Schedule</h1>
          <p className="hero-description">
            Your schedule has been processed! Review the details below and make any necessary adjustments.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="review-content">
        <form onSubmit={handleSubmit} className="schedule-form">
          {/* Classes List */}
          <div className="classes-grid">
            {classes.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>No classes found</h3>
                <p>Add your first class to get started!</p>
              </div>
            )}

            {classes.map((cls) => (
              <div key={cls.id} className="class-card">
                <div className="card-content">
                  {/* Course Name Header */}
                  <div className="course-header">
                    <input
                      type="text"
                      placeholder="Course Name"
                      className="course-name"
                      value={cls.courseCode}
                      onChange={(e) => handleClassChange(cls.id, 'courseCode', e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveClass(cls.id)} 
                      className="remove-btn"
                      aria-label="Remove class"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  {/* Days Selection */}
                  <div className="days-section">
                    <span className="field-label">Days</span>
                    <div className="days-input">
                      <select
                        multiple
                        value={cls.days}
                        onChange={(e) => {
                          const selectedDays = Array.from(e.target.selectedOptions, option => option.value);
                          handleClassChange(cls.id, 'days', selectedDays);
                        }}
                        className="days-select"
                        size={4}
                      >
                        {daysOfWeekOptions.map(day => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      {cls.days.length > 0 && (
                        <div className="selected-days">
                          {cls.days.map(day => (
                            <span key={day} className="day-pill">
                              {day.substring(0, 3)}
                              <button
                                type="button"
                                onClick={() => {
                                  const newDays = cls.days.filter(d => d !== day);
                                  handleClassChange(cls.id, 'days', newDays);
                                }}
                                className="day-remove"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Inputs */}
                  <div className="time-section">
                    <div className="time-group">
                      <span className="field-label">Start</span>
                      <input
                        type="time"
                        id={`startTime-${cls.id}`}
                        value={cls.startTime}
                        onChange={(e) => handleClassChange(cls.id, 'startTime', e.target.value)}
                        className="time-input"
                        required
                      />
                    </div>
                    <div className="time-group">
                      <span className="field-label">End</span>
                      <input
                        type="time"
                        id={`endTime-${cls.id}`}
                        value={cls.endTime}
                        onChange={(e) => handleClassChange(cls.id, 'endTime', e.target.value)}
                        className="time-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="location-section">
                    <span className="field-label">Location</span>
                    <input
                      type="text"
                      id={`location-${cls.id}`}
                      placeholder="Room/Building"
                      value={cls.location || ''}
                      onChange={(e) => handleClassChange(cls.id, 'location', e.target.value)}
                      className="location-input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Class Button */}
          <button type="button" onClick={handleAddEmptyClass} className="add-class-btn">
            <div className="add-icon">
              <AddIcon />
            </div>
            <span>Add Another Class</span>
          </button>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" onClick={onBackToUpload} className="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)"/>
              </svg>
              Back to Upload
            </button>
            <button type="submit" className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Confirm Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleReviewForm;