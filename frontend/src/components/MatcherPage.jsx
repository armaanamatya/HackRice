import React, { useState, useEffect } from 'react';

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

/**
 * A page for matching students based on their schedules.
 * @param {object} props
 * @param {ClassData[]} props.currentUserSchedule - The schedule of the currently logged-in user.
 * @param {function(): void} props.onBackToDashboard - Callback to return to the dashboard.
 */
const MatcherPage = ({ currentUserSchedule, onBackToDashboard, userId, userUniversity }) => {
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [majorFilter, setMajorFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [interestsFilter, setInterestsFilter] = useState("");

  useEffect(() => {
    const fetchMatchedStudents = async () => {
      if (!userId || !currentUserSchedule || currentUserSchedule.length === 0) {
        setMatchedStudents([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/match-by-classes/${userId}?major=${majorFilter}&year=${yearFilter}&interests=${interestsFilter}&university=${userUniversity}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch matched students.");
        }
        const data = await response.json();
        setMatchedStudents(data);
      } catch (err) {
        console.error("Error fetching matched students:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchedStudents();
  }, [userId, currentUserSchedule, majorFilter, yearFilter, interestsFilter, userUniversity]);

  return (
    <div className="matcher-page-container">
      <button onClick={onBackToDashboard} className="back-button">← Back to Dashboard</button>
      <h2>Find Your Classmates</h2>
      <p>Connect with students taking the same classes as you!</p>

      <div className="filters-container">
        <input
          type="text"
          placeholder="Filter by Major"
          value={majorFilter}
          onChange={(e) => setMajorFilter(e.target.value)}
          className="filter-input"
        />
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Filter by Year</option>
          <option value="Freshman">Freshman</option>
          <option value="Sophomore">Sophomore</option>
          <option value="Junior">Junior</option>
          <option value="Senior">Senior</option>
        </select>
        <input
          type="text"
          placeholder="Filter by Interests (comma-separated)"
          value={interestsFilter}
          onChange={(e) => setInterestsFilter(e.target.value)}
          className="filter-input"
        />
      </div>

      {isLoading && <p>Loading matches...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!isLoading && !error && (!currentUserSchedule || currentUserSchedule.length === 0) ? (
        <p className="no-schedule-message">Please upload your schedule on the Dashboard to find matches.</p>
      ) : (!isLoading && !error && matchedStudents.length > 0) ? (
        <div className="match-results">
          {matchedStudents.map(student => (
            <div key={student._id} className="user-card">
              <h4>{student.name}</h4>
              <p><strong>Major:</strong> {student.major}</p>
              <p><strong>Year:</strong> {student.year}</p>
              <p><strong>Common Classes:</strong> {student.commonClassesCount}</p>
              <div className="common-classes-list">
                {student.commonClasses.map((cls, index) => (
                  <span key={index} className="common-class-tag">{cls.courseCode} ({cls.courseName})</span>
                ))}
              </div>
              <button className="connect-button">Connect</button>
            </div>
          ))}
        </div>
      ) : (!isLoading && !error && matchedStudents.length === 0) ? (
        <p className="no-matches-message">No exact matches found with other students yet. Try uploading a more complete schedule!</p>
      ) : null}
    </div>
  );
};

export default MatcherPage;
