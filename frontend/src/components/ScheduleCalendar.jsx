import React, { useState, useMemo } from "react";
import "./ScheduleCalendar.css";

const ScheduleCalendar = ({ courses = [], onEditSchedule, userData, isPopupMode = false, allowEditing = true }) => {
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  // Define weekdays
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayAbbreviations = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Time slots (7 AM to 10 PM)
  const timeSlots = [];
  for (let hour = 1; hour <= 24; hour++) {
    timeSlots.push(`${hour}:00`);
  }

  // Convert course data to grid events
  const weeklyEvents = useMemo(() => {
    if (!courses || courses.length === 0) return {};

    const events = {};

    courses.forEach((course) => {
      if (!course.days || course.days.length === 0) return;

      course.days.forEach((day) => {
        const dayKey = day; // Mon, Tue, Wed, etc.
        if (!events[dayKey]) events[dayKey] = [];

        const startTime = course.startTime; // e.g., "09:00"
        const endTime = course.endTime; // e.g., "09:50"

        const startHour = parseInt(startTime.split(":")[0]);
        const startMinute = parseInt(startTime.split(":")[1]);
        const endHour = parseInt(endTime.split(":")[0]);
        const endMinute = parseInt(endTime.split(":")[1]);

        // Calculate position and height (30px per hour instead of 60px)
        const startPosition = (startHour - 7) * 30 + startMinute / 2; // 30px per hour from 7 AM
        const endPosition = (endHour - 7) * 30 + endMinute / 2;
        const duration = endPosition - startPosition;

        events[dayKey].push({
          ...course,
          startPosition,
          endPosition,
          duration,
          displayTime: `${startTime} - ${endTime}`,
          startTime,
          endTime,
        });
      });
    });

    // Sort events by start time for each day and add gaps
    Object.keys(events).forEach((dayKey) => {
      events[dayKey].sort((a, b) => a.startPosition - b.startPosition);
      
      // Add gaps between consecutive classes
      for (let i = 0; i < events[dayKey].length; i++) {
        const currentEvent = events[dayKey][i];
        const nextEvent = events[dayKey][i + 1];
        
        // If there's a next event and it starts exactly when current ends (back-to-back)
        if (nextEvent && Math.abs(nextEvent.startPosition - (currentEvent.startPosition + currentEvent.duration)) <= 2) {
          // Add a small gap (3px) by reducing current event duration
          const gapSize = 3;
          currentEvent.duration = Math.max(currentEvent.duration - gapSize, 15); // Minimum 15px height
          
          // Also ensure next event starts slightly later to create visual separation
          nextEvent.startPosition = currentEvent.startPosition + currentEvent.duration + gapSize;
        }
      }
    });

    return events;
  }, [courses]);

  // Handle course hover
  const handleCourseMouseEnter = (course, event) => {
    const rect = event.target.getBoundingClientRect();
    const calendarContainer = event.target.closest('.schedule-calendar-container');
    const calendarRect = calendarContainer.getBoundingClientRect();
    
    const menuWidth = 220;
    const menuHeight = 120;
    const gap = 8;
    
    // Calculate position relative to the calendar container
    const relativeRect = {
      left: rect.left - calendarRect.left,
      right: rect.right - calendarRect.left,
      top: rect.top - calendarRect.top,
      bottom: rect.bottom - calendarRect.top
    };
    
    let x, y;
    
    // Try positioning to the right of the class box first
    x = relativeRect.right + gap;
    y = relativeRect.top;
    
    // If menu would overflow the calendar on the right, position to the left
    if (x + menuWidth > calendarRect.width - 20) {
      x = relativeRect.left - menuWidth - gap;
    }
    
    // If menu would overflow on the left, position it inside with minimal gap
    if (x < 20) {
      x = 20;
    }
    
    // If menu would overflow at the bottom, move it up
    if (y + menuHeight > calendarRect.height - 20) {
      y = calendarRect.height - menuHeight - 20;
    }
    
    // If menu would overflow at the top, move it down
    if (y < 20) {
      y = 20;
    }
    
    // Convert back to viewport coordinates for fixed positioning
    setContextMenuPosition({
      x: x + calendarRect.left,
      y: y + calendarRect.top
    });
    setHoveredCourse(course);
  };

  const handleCourseMouseLeave = () => {
    setHoveredCourse(null);
  };

  // Handle joining group chat
  const handleJoinGroupChat = async (course) => {
    console.log("Join group chat for:", course.courseCode);
    setHoveredCourse(null);
    
    try {
      // Get user's university from userData
      const userUniversity = userData?.university;
      if (!userUniversity || userUniversity === 'Other') {
        console.error('User university not found or invalid');
        alert('Unable to join group chat: University information not available');
        return;
      }

      // Prepare request payload
      const payload = {
        userId: userData?.id || userData?._id, // Support both Auth0 ID and database ID
        courseCode: course.courseCode,
        courseName: course.courseName,
        university: userUniversity
      };

      console.log('Joining course group with payload:', payload);

      // Call the API to join/create group chat
      const response = await fetch('/api/chat/join-course-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to join group chat');
      }

      const data = await response.json();
      console.log('Successfully joined group chat:', data);

      // Show success message
      alert(`${data.message}! Group: "${data.conversation.name}" with ${data.conversation.participants.length} member(s).`);

      // Optionally emit a custom event to notify chat sidebar to refresh
      window.dispatchEvent(new CustomEvent('groupChatJoined', { 
        detail: { 
          conversation: data.conversation,
          course: course
        } 
      }));

    } catch (error) {
      console.error('Error joining group chat:', error);
      alert(`Failed to join group chat: ${error.message}`);
    }
  };

  // Convert time to 12-hour format
  const formatTime = (hour) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  if (!courses || courses.length === 0) {
    return (
      <div className="schedule-calendar-container">
        <div className="calendar-header">
          <div className="header-content">
            <h2 className="header-title">
              {isPopupMode ? `${userData?.name || 'User'}'s Weekly Schedule` : 'Your Weekly Schedule'}
            </h2>
            <p className="header-subtitle">
              {isPopupMode 
                ? `${userData?.name || 'This user'} hasn't uploaded their schedule yet.`
                : 'No courses found. Upload your schedule to get started!'
              }
            </p>
          </div>
          {allowEditing && (
            <button className="edit-schedule-btn" onClick={onEditSchedule}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Schedule
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-calendar-container">
      <div className="calendar-header">
        <div className="header-content">
          <h2 className="header-title">Your Weekly Schedule</h2>
          <p className="header-subtitle">
            Welcome back, {userData?.name || "Student"}! Here's your weekly
            class schedule.
          </p>
          <div className="schedule-stats">
            <div className="stat-item">
              <span className="stat-number">{courses.length}</span>
              <span className="stat-label">Courses</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {courses.reduce(
                  (total, course) =>
                    total + (course.days ? course.days.length : 0),
                  0
                )}
              </span>
              <span className="stat-label">Weekly Classes</span>
            </div>
          </div>
        </div>
        {allowEditing && (
          <div className="header-actions">
            <button className="edit-schedule-btn" onClick={onEditSchedule}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m18 2 4 4-12 12H6v-4L18 2Z" />
              </svg>
              Edit Schedule
            </button>
          </div>
        )}
      </div>

      <div className="week-calendar-wrapper">
        <div className="week-calendar">
          {/* Time Column */}
          <div className="time-column">
            <div className="time-header"></div>{" "}
            {/* Empty space for day headers */}
            {timeSlots.map((time) => (
              <div key={time} className="time-slot">
                <span className="time-label">{formatTime(parseInt(time))}</span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {dayAbbreviations.map((dayAbbr) => {
            const fullDay = weekdays[dayAbbreviations.indexOf(dayAbbr)];
            const dayEvents = weeklyEvents[dayAbbr] || [];

            return (
              <div key={dayAbbr} className="day-column">
                <div className="day-header">
                  <span className="day-name">{fullDay}</span>
                  <span className="day-abbr">{dayAbbr}</span>
                </div>

                <div
                  className="day-events"
                  style={{
                    position: "relative",
                    height: `${timeSlots.length * 30}px`,
                  }}
                >
                  {dayEvents.map((event, index) => {
                    // Calculate duration in minutes for styling
                    const durationMinutes = event.duration * 2; // Since 0.5px per minute
                    let eventClasses = "course-event";

                    if (durationMinutes >= 120) {
                      // 2+ hours
                      eventClasses += " very-long-event";
                    } else if (durationMinutes >= 90) {
                      // 1.5+ hours
                      eventClasses += " long-event";
                    }

                    return (
                      <div
                        key={`${event.id}-${index}`}
                        className={eventClasses}
                        style={{
                          position: "absolute",
                          top: `${event.startPosition}px`,
                          height: `${event.duration}px`,
                          left: "4px",
                          right: "4px",
                          zIndex: 1,
                        }}
                        onMouseEnter={(e) => handleCourseMouseEnter(event, e)}
                        onMouseLeave={handleCourseMouseLeave}
                      >
                        <div className="event-content">
                          <div className="event-title" title={event.courseCode}>
                            {event.courseCode}
                          </div>
                          {durationMinutes >= 60 && (
                            <div className="event-time">
                              {event.displayTime}
                            </div>
                          )}
                          {durationMinutes >= 90 && event.location && (
                            <div
                              className="event-location"
                              title={event.location}
                            >
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Context Menu */}
      {hoveredCourse && (
        <div
          className="context-menu"
          style={{
            position: "fixed",
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
            zIndex: 1000,
          }}
          onMouseEnter={() => setHoveredCourse(hoveredCourse)} // Keep menu open on hover
          onMouseLeave={handleCourseMouseLeave}
        >
          <div className="context-menu-header">
            <h4>{hoveredCourse.courseCode}</h4>
            {hoveredCourse.location && <p>{hoveredCourse.location}</p>}
          </div>
          <div className="context-menu-actions">
            <button
              className="context-menu-btn"
              onClick={() => handleJoinGroupChat(hoveredCourse)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              Join Group Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleCalendar;
