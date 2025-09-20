import React, { useState, useEffect } from 'react';
import { mockUsers } from '../utils/mockUsers';

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

/**
 * A page for matching students based on their schedules.
 * @param {object} props
 * @param {ClassData[]} props.currentUserSchedule - The schedule of the currently logged-in user.
 * @param {function(): void} props.onBackToDashboard - Callback to return to the dashboard.
 */
const MatcherPage = ({ currentUserSchedule, onBackToDashboard }) => {
  const [matchedStudents, setMatchedStudents] = useState([]);

  useEffect(() => {
    if (currentUserSchedule && currentUserSchedule.length > 0) {
      const findMatches = () => {
        const matches = mockUsers
          .map(mockUser => {
            let commonClassesCount = 0;
            const commonClasses = [];

            currentUserSchedule.forEach(userClass => {
              mockUser.schedule.forEach(mockClass => {
                // Check for exact same course, days, and times
                const isCourseMatch = userClass.course === mockClass.course;
                const isDayMatch = userClass.days.some(day => mockClass.days.includes(day));
                const isTimeOverlap = (
                  (userClass.startTime < mockClass.endTime && userClass.endTime > mockClass.startTime) ||
                  (mockClass.startTime < userClass.endTime && mockClass.endTime > userClass.startTime)
                );

                if (isCourseMatch && isDayMatch && isTimeOverlap) {
                  commonClassesCount++;
                  commonClasses.push({ userClass, mockClass });
                }
              });
            });

            return { ...mockUser, commonClassesCount, commonClasses };
          })
          .filter(student => student.commonClassesCount > 0) // Only show students with at least one common class
          .sort((a, b) => b.commonClassesCount - a.commonClassesCount); // Sort by most common classes
        
        setMatchedStudents(matches);
      };

      findMatches();
    } else {
      setMatchedStudents([]);
    }
  }, [currentUserSchedule]);

  return (
    <div className="matcher-page-container">
      <button onClick={onBackToDashboard} className="back-button">← Back to Dashboard</button>
      <h2>Find Your Classmates</h2>
      <p>Connect with students taking the same classes as you!</p>

      {!currentUserSchedule || currentUserSchedule.length === 0 ? (
        <p className="no-schedule-message">Please upload your schedule on the Dashboard to find matches.</p>
      ) : matchedStudents.length > 0 ? (
        <div className="match-results">
          {matchedStudents.map(student => (
            <div key={student.id} className="user-card">
              <h4>{student.name}</h4>
              <p><strong>Major:</strong> {student.major}</p>
              <p><strong>Year:</strong> {student.year}</p>
              <p><strong>Common Classes:</strong> {student.commonClassesCount}</p>
              <div className="common-classes-list">
                {student.commonClasses.map((cls, index) => (
                  <span key={index} className="common-class-tag">{cls.userClass.course}</span>
                ))}
              </div>
              <button className="connect-button">Connect</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-matches-message">No exact matches found with other students yet. Try uploading a more complete schedule!</p>
      )}
    </div>
  );
};

export default MatcherPage;
