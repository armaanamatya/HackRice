import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom'; // Remove useNavigate and Link imports
import './DashboardPage.css';
import ScheduleUploader from './ScheduleUploader';
import ScheduleReviewForm from './ScheduleReviewForm';
import InteractiveScheduleDisplay from './InteractiveScheduleDisplay';
import { saveScheduleToLocalStorage, loadScheduleFromLocalStorage } from '../utils/localStorageUtils';
// import { useAuth0 } from '@auth0/auth0-react'; // Placeholder for Auth0 import

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

const DashboardPage = ({
  userData,
  // Removed onBackToDashboard, onNavigateToMatcher, onNavigateToProfileDetails, onLogout props
  onScheduleUpdate,
  userSchedule,
}) => {
  const [currentSchedule, setCurrentSchedule] = useState(null); // The final, validated schedule
  const [ocrParsedClasses, setOcrParsedClasses] = useState(null); // Data from OCR for review
  const [viewMode, setViewMode] = useState('uploader'); // 'uploader', 'reviewer', 'display'

  // Removed useNavigate initialization
  // const navigate = useNavigate();

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
    <div className="dashboard-page-content"> {/* Changed class name for clarity */}
      {/* Header, navigation links, profile icon, and logout button removed */}
      <h2 className="dashboard-welcome-title">Welcome to your Scedulr Dashboard, {userData?.name || 'User'}!</h2>
      <p className="dashboard-intro-text">This is your central hub for academic networking.</p>

      {renderContent()}
    </div>
  );
};

export default DashboardPage;
