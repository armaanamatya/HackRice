import React, { useState, useEffect } from 'react';
import { 
  IconHome, 
  IconUsers, 
  IconUser, 
  IconLogout,
  IconMenu2,
  IconBell,
  IconSettings,
  IconSearch,
  IconChevronLeft
} from '@tabler/icons-react';
import './DashboardPage.css';
import ScheduleUploader from './ScheduleUploader';
import ScheduleReviewForm from './ScheduleReviewForm';
import InteractiveScheduleDisplay from './InteractiveScheduleDisplay';
import { saveScheduleToLocalStorage, loadScheduleFromLocalStorage } from '../utils/localStorageUtils';

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

const DashboardPage = ({
  userData,
  onNavigateToMatcher,
  onNavigateToProfileDetails,
  onLogout,
  onScheduleUpdate,
  userSchedule,
}) => {
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [ocrParsedClasses, setOcrParsedClasses] = useState(null);
  const [viewMode, setViewMode] = useState('uploader');
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const userId = userData?.id || 'guest';

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

  const handleScheduleValidated = async (validatedClasses) => {
    try {
      // Save courses to database
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData?._id,
          courses: validatedClasses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save courses');
      }

      console.log('Courses saved successfully to database');
      
      setCurrentSchedule(validatedClasses);
      setOcrParsedClasses(null); // Clear review data
      setViewMode('display');
      
      // Call the parent callback if it exists
      if (onScheduleUpdate) {
        onScheduleUpdate(validatedClasses);
      }
    } catch (error) {
      console.error('Error saving courses:', error);
      alert(`Failed to save courses: ${error.message}`);
    }
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
        return <ScheduleUploader onScheduleParsed={handleScheduleParsed} userId={userData?._id} />;
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
        return <ScheduleUploader onScheduleParsed={handleScheduleParsed} userId={userData?._id} />;
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconHome },
    { id: 'connections', label: 'Connections', icon: IconUsers },
    { id: 'profile', label: 'Profile', icon: IconUser },
  ];

  const handleNavigation = (itemId) => {
    setActiveNavItem(itemId);
    
    switch (itemId) {
      case 'connections':
        if (onNavigateToMatcher) onNavigateToMatcher();
        break;
      case 'profile':
        if (onNavigateToProfileDetails) onNavigateToProfileDetails();
        break;
      default:
        // Handle other navigation items
        break;
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Helper function to check if a string is an email
  const isEmail = (text) => /^[\w-.]+@[\w-.]+\.[\w-.]+$/.test(text);

  const displayName = (
    userData?.profileCompleted === false && isEmail(userData?.name)
      ? "User"
      : userData?.name || "User"
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h2>Scedulr</h2>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <IconChevronLeft size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id} className="nav-item">
                  <button
                    className={`nav-link ${activeNavItem === item.id ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.id)}
                  >
                    <IconComponent size={20} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogoutClick}>
            <IconLogout size={20} className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* App Bar */}
        <header className="dashboard-app-bar">
          <div className="app-bar-left">
            <button 
              className="mobile-menu-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <IconMenu2 size={24} />
            </button>
            
            <div className="search-container">
              <IconSearch size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search..."
                className="search-input"
              />
            </div>
          </div>
          
          <div className="app-bar-right">
            <button className="notification-button" aria-label="Notifications">
              <IconBell size={20} />
            </button>
            
            <button className="settings-button" aria-label="Settings">
              <IconSettings size={20} />
            </button>
            
            <div className="user-profile">
              <div className="user-avatar">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{userData?.name || 'User'}</span>
                <span className="user-email">{userData?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="dashboard-content">
          <div className="content-header">
            <h1 className="page-title">
              Welcome back, {displayName}!
            </h1>
            <p className="page-subtitle">
              Manage your academic schedule and connect with classmates
            </p>
          </div>
          
          <div className="content-body">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
