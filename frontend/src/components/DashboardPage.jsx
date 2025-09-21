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
  IconChevronLeft,
  IconBook2,// Added IconBook2
  IconCalendar
} from '@tabler/icons-react';
import './DashboardPage.css';
import ScheduleUploader from './ScheduleUploader';
import ScheduleReviewForm from './ScheduleReviewForm';
import InteractiveScheduleDisplay from './InteractiveScheduleDisplay';
import ScheduleCalendar from './ScheduleCalendar';
import ToastContainer, { showSuccessToast, showErrorToast } from './ToastContainer';
import SettingsDropdown from './SettingsDropdown'; // Import SettingsDropdown
import SearchResultsDropdown from './SearchResultsDropdown'; // Import SearchResultsDropdown
import { saveScheduleToLocalStorage, loadScheduleFromLocalStorage } from '../utils/localStorageUtils';
import '../utils/clearStorage'; // Import storage debugging utilities
import ClassesPage from './ClassesPage'; // Added ClassesPage import

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
  onNavigateToClasses, // Add new prop here
  // onNavigateToSettings, // Add new prop here
}) => {
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [ocrParsedClasses, setOcrParsedClasses] = useState(null);
  const [viewMode, setViewMode] = useState('uploader');
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false); // New state for dropdown
  const [savedCourses, setSavedCourses] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query
  const [searchResults, setSearchResults] = useState([]); // New state for search results
  const [isSearching, setIsSearching] = useState(false); // New state for search loading
  const [searchError, setSearchError] = useState(null); // New state for search errors

  const userId = userData?.id || 'guest';

  // Clear localStorage to ensure database is authoritative
  const clearLocalStorageData = () => {
    const keys = Object.keys(localStorage);
    const scheduleKeys = keys.filter(key => key.startsWith('schedule_'));
    scheduleKeys.forEach(key => {
      console.log('Clearing localStorage key:', key);
      localStorage.removeItem(key);
    });
  };

  // Fetch saved courses from database
  const fetchSavedCourses = async () => {
    if (!userData?._id) {
      console.log('No userData._id, skipping course fetch');
      setIsLoadingCourses(false);
      return;
    }

    console.log('Fetching saved courses from database for userId:', userData._id);

    try {
      const response = await fetch(`/api/courses/${userData._id}`);
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        
        if (data.courses && data.courses.length > 0) {
          console.log('Found courses in database:', data.courses.length);
          setSavedCourses(data.courses);
          setCurrentSchedule(data.courses); // Update currentSchedule too
          setViewMode('calendar');
          
          // Clear any conflicting localStorage data
          console.log('Clearing localStorage since we have database data');
          localStorage.removeItem(`schedule_${userId}`);
        } else {
          console.log('No courses found in database, switching to uploader');
          setSavedCourses(null);
          setCurrentSchedule(null);
          setViewMode('uploader');
          
          // Clear localStorage as well since database is authoritative
          localStorage.removeItem(`schedule_${userId}`);
        }
      } else {
        console.log('API request failed, switching to uploader');
        setSavedCourses(null);
        setCurrentSchedule(null);
        setViewMode('uploader');
      }
    } catch (error) {
      console.error('Error fetching saved courses:', error);
      setSavedCourses(null);
      setCurrentSchedule(null);
      setViewMode('uploader');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    // Clear localStorage first to ensure database is authoritative
    clearLocalStorageData();
    // Then fetch from database
    fetchSavedCourses();
  }, [userData?._id]);

  // DISABLED: LocalStorage loading - database is now authoritative
  // useEffect(() => {
  //   // Load schedule from localStorage on component mount
  //   const loadedSchedule = loadScheduleFromLocalStorage(userId);
  //   if (loadedSchedule) {
  //     setCurrentSchedule(loadedSchedule);
  //     // Don't override viewMode if we already have saved courses
  //     if (!savedCourses) {
  //       setViewMode('display');
  //     }
  //   }
  // }, [userId, savedCourses]);

  // DISABLED: LocalStorage saving - database is primary storage now
  // useEffect(() => {
  //   // Save schedule to localStorage whenever currentSchedule changes
  //   if (currentSchedule) {
  //     saveScheduleToLocalStorage(userId, currentSchedule);
  //   }
  // }, [currentSchedule, userId]);

  const handleScheduleParsed = (parsedData) => {
    setOcrParsedClasses(parsedData);
    setViewMode('reviewer');
  };

  const handleScheduleValidated = async (validatedClasses) => {
    try {
      console.log('DashboardPage: handleScheduleValidated called with:', {
        userId: userData?._id,
        courseCount: validatedClasses?.length,
        courses: validatedClasses
      });

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
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('API Error:', errorData);
        throw new Error(`Failed to save courses: ${errorData.message}`);
      }

      const responseData = await response.json();
      console.log('Courses saved successfully to database:', responseData);
      showSuccessToast('Schedule saved successfully! Your courses have been updated.');
      
      // Update saved courses and switch to calendar view
      setSavedCourses(validatedClasses);
      setCurrentSchedule(validatedClasses);
      setOcrParsedClasses(null); // Clear review data
      setViewMode('calendar');
      
      // Call the parent callback if it exists
      if (onScheduleUpdate) {
        onScheduleUpdate(validatedClasses);
      }
    } catch (error) {
      console.error('Error saving courses:', error);
      showErrorToast(`Failed to save courses: ${error.message}`);
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
    // Show loading state while fetching courses
    if (isLoadingCourses) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your schedule...</p>
        </div>
      );
    }

    switch (viewMode) {
      case 'calendar':
        console.log('Rendering calendar with courses from savedCourses:', savedCourses);
        return (
          <ScheduleCalendar
            courses={savedCourses || []}
            onEditSchedule={() => {
              // Switch to uploader for editing
              console.log('Edit schedule clicked, clearing saved courses');
              setSavedCourses(null);
              setCurrentSchedule(null);
              setViewMode('uploader');
            }}
            userData={userData}
          />
        );
      case 'uploader':
        return (
          <ScheduleUploader 
            onScheduleParsed={handleScheduleParsed} 
            onScheduleValidated={handleScheduleValidated}
            userId={userData?._id} 
            userData={userData}
          />
        );
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
      case 'classes': // New case for ClassesPage
        return <ClassesPage userSchedule={userSchedule} />;
      default:
        return (
          <ScheduleUploader 
            onScheduleParsed={handleScheduleParsed} 
            onScheduleValidated={handleScheduleValidated}
            userId={userData?._id} 
            userData={userData}
          />
        );
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconHome },
    { id: 'schedule', label: 'Schedule', icon: IconCalendar },
    { id: 'classes', label: 'Classes', icon: IconBook2 }, // New Classes item
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
      case 'classes': // Handle navigation to classes page
        if (onNavigateToClasses) onNavigateToClasses();
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

  const toggleSettingsDropdown = () => {
    setShowSettingsDropdown(prev => !prev);
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const closeSearchResults = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    // Don't search for very short queries
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const handler = setTimeout(async () => {
      try {
        console.log('Searching for:', searchQuery, 'at university:', userData?.university);
        
        // Construct the search URL with proper encoding
        const searchParams = new URLSearchParams();
        searchParams.append('name', searchQuery.trim());
        if (userData?.university && userData.university !== 'Other') {
          searchParams.append('university', userData.university);
        }
        
        const searchUrl = `/api/users/search?${searchParams.toString()}`;
        console.log('Search URL:', searchUrl);
        
        const response = await fetch(searchUrl);
        
        console.log('Search response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchError(error.message);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, userData?.university]);

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
          {/* <button className="settings-button" aria-label="Settings" onClick={() => handleNavigation('settings')}>
            <IconSettings size={20} className="nav-icon" />
            <span className="nav-label">Settings</span>
          </button> */}
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
                value={searchQuery}
                onChange={handleSearchInputChange}
              />
              {(searchQuery.length > 0 || isSearching || searchError) && (
                <SearchResultsDropdown
                  results={searchResults}
                  isLoading={isSearching}
                  error={searchError}
                  onClose={closeSearchResults}
                  onUserClick={onNavigateToProfileDetails} // Pass the navigation prop
                />
              )}
            </div>
          </div>
          
          <div className="app-bar-right">
            <button className="notification-button" aria-label="Notifications">
              <IconBell size={20} />
            </button>
            
            <div className="settings-dropdown-wrapper">
              <button 
                className="settings-button" 
                aria-label="Settings" 
                onClick={toggleSettingsDropdown}
              >
                <IconSettings size={20} />
              </button>
              <SettingsDropdown isOpen={showSettingsDropdown} onClose={toggleSettingsDropdown} />
            </div>
            
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
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default DashboardPage;
