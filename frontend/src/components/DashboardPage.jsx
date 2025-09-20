import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import ScheduleUploader from './ScheduleUploader';
import ScheduleReviewForm from './ScheduleReviewForm';
import InteractiveScheduleDisplay from './InteractiveScheduleDisplay';
import { saveScheduleToLocalStorage, loadScheduleFromLocalStorage } from '../utils/localStorageUtils';
// import { useAuth0 } from '@auth0/auth0-react'; // Placeholder for Auth0 import

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

const DashboardPage = ({ userData, onBackToDashboard }) => {
  const [currentSchedule, setCurrentSchedule] = useState(null); // The final, validated schedule
  const [ocrParsedClasses, setOcrParsedClasses] = useState(null); // Data from OCR for review
  const [viewMode, setViewMode] = useState('uploader'); // 'uploader', 'reviewer', 'display'

  // Auth0 Placeholder: Get user ID from Auth0 context
  // const { user, isAuthenticated } = useAuth0();
  // const userId = isAuthenticated ? user.sub : 'guest';
  const userId = userData?.id || 'guest'; // Using passed userData for now

  useEffect(() => {
    // Load schedule from localStorage on component mount
    const loadedSchedule = loadScheduleFromLocalStorage(userId);
    if (loadedSchedule) {
      setCurrentSchedule(loadedSchedule);
      setViewMode('display');
    }
  }, [userId]);

  useEffect(() => {
    // Save schedule to localStorage whenever currentSchedule changes
    if (currentSchedule) {
      saveScheduleToLocalStorage(userId, currentSchedule);
    }
  }, [currentSchedule, userId]);

  const handleScheduleParsed = (parsedData) => {
    setOcrParsedClasses(parsedData);
    setViewMode('reviewer');
  };

  const handleScheduleValidated = (validatedClasses) => {
    setCurrentSchedule(validatedClasses);
    setOcrParsedClasses(null); // Clear review data
    setViewMode('display');
  };

  const handleBackToUpload = () => {
    setOcrParsedClasses(null);
    setCurrentSchedule(null); // Clear current schedule when going back to upload
    setViewMode('uploader');
  };

  const handleEditSchedule = () => {
    setOcrParsedClasses(currentSchedule); // Re-populate review form with current schedule
    setViewMode('reviewer');
  };

  const handleImportSchedule = (importedSchedule) => {
    setCurrentSchedule(importedSchedule);
    setViewMode('display');
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'uploader':
        return <ScheduleUploader onScheduleParsed={handleScheduleParsed} />;
      case 'reviewer':
        return (
          <ScheduleReviewForm
            initialClasses={ocrParsedClasses || []}
            onScheduleValidated={handleScheduleValidated}
            onBackToUpload={handleBackToUpload}
          />
        );
      case 'display':
        return (
          <InteractiveScheduleDisplay
            schedule={currentSchedule || []}
            onEditSchedule={handleEditSchedule}
            onImportSchedule={handleImportSchedule}
          />
        );
      default:
        return <ScheduleUploader onScheduleParsed={handleScheduleParsed} />;
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="container">
          <nav className="dashboard-navbar">
            <a href="#" className="dashboard-logo" onClick={onBackToDashboard}>Scedulr</a>
            <ul className="dashboard-nav-links">
              <li><a href="#">Community</a></li>
              <li><a href="#">Settings</a></li>
            </ul>
            <div className="profile-icon-container">
              {/* Auth0 Placeholder: display user.picture or user.initials */}
              <span className="profile-initial">{userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}</span>
            </div>
          </nav>
        </div>
      </header>
      <main className="dashboard-main-content">
        <div className="container">
          <h2>Welcome to your Scedulr Dashboard, {userData?.name || 'User'}!</h2>
          <p>This is your central hub for academic networking.</p>

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
