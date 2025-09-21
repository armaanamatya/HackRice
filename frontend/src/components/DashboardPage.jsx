import React, { useState, useEffect, useCallback } from "react";
import {
  IconHome,
  IconUsers,
  IconUser,
  IconLogout,
  IconMenu2,
  IconSettings,
  IconChevronLeft,
  IconBook2,
  IconBookmark,
  IconSearch,
} from "@tabler/icons-react";
import "./DashboardPage.css";
import ScheduleUploader from "./ScheduleUploader";
import ScheduleReviewForm from "./ScheduleReviewForm";
import InteractiveScheduleDisplay from "./InteractiveScheduleDisplay";
import ScheduleCalendar from "./ScheduleCalendar";
import ToastContainer, {
  showSuccessToast,
  showErrorToast,
} from "./ToastContainer";

import SettingsDropdown from "./SettingsDropdown";
import SearchResultsDropdown from "./SearchResultsDropdown";
import ChatSidebar from "./ChatSidebar";
import "../utils/clearStorage";
import ClassesPage from "./ClassesPage";

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

const DashboardPage = ({
  userData,
  onNavigateToMatcher,
  onNavigateToProfileDetails,
  onLogout,
  onScheduleUpdate,
  onNavigateToClasses,
  onNavigateToBookmarks,
  userUniversity,
}) => {
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [ocrParsedClasses, setOcrParsedClasses] = useState(null);
  const [viewMode, setViewMode] = useState("uploader");
  const [activeNavItem, setActiveNavItem] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [savedCourses, setSavedCourses] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const userId = userData?.id || "guest";

  const clearLocalStorageData = () => {
    const keys = Object.keys(localStorage);
    const scheduleKeys = keys.filter((key) => key.startsWith("schedule_"));
    scheduleKeys.forEach((key) => {
      console.log("Clearing localStorage key:", key);
      localStorage.removeItem(key);
    });
  };

  const fetchSavedCourses = useCallback(async () => {
    if (!userData?._id) {
      console.log("No userData._id, skipping course fetch");
      setIsLoadingCourses(false);
      return;
    }

    console.log("Fetching saved courses from database for userId:", userData._id);

    try {
      const response = await fetch(`/api/courses/${userData._id}`);
      console.log("API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("API response data:", data);

        if (data.courses && data.courses.length > 0) {
          console.log("Found courses in database:", data.courses.length);
          setSavedCourses(data.courses);
          setCurrentSchedule(data.courses);
          setViewMode("calendar");

          console.log("Clearing localStorage since we have database data");
          localStorage.removeItem(`schedule_${userId}`);
        } else {
          console.log("No courses found in database, switching to uploader");
          setSavedCourses(null);
          setCurrentSchedule(null);
          setViewMode("uploader");

          localStorage.removeItem(`schedule_${userId}`);
        }
      } else {
        console.log("API request failed, switching to uploader");
        setSavedCourses(null);
        setCurrentSchedule(null);
        setViewMode("uploader");
      }
    } catch (error) {
      console.error("Error fetching saved courses:", error);
      setSavedCourses(null);
      setCurrentSchedule(null);
      setViewMode("uploader");
    } finally {
      setIsLoadingCourses(false);
    }
  }, [userData?._id, userId]);

  useEffect(() => {
    clearLocalStorageData();
    fetchSavedCourses();
  }, [userData?._id, fetchSavedCourses]);

  const handleScheduleParsed = (parsedData) => {
    setOcrParsedClasses(parsedData);
    setViewMode("reviewer");
  };

  const handleScheduleValidated = async (validatedClasses) => {
    try {
      console.log("DashboardPage: handleScheduleValidated called with:", {
        userId: userData?._id,
        courseCount: validatedClasses?.length,
        courses: validatedClasses,
      });

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData?._id,
          courses: validatedClasses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error("API Error:", errorData);
        throw new Error(`Failed to save courses: ${errorData.message}`);
      }

      const responseData = await response.json();
      console.log("Courses saved successfully to database:", responseData);
      showSuccessToast("Schedule saved successfully! Your courses have been updated.");

      setSavedCourses(validatedClasses);
      setCurrentSchedule(validatedClasses);
      setOcrParsedClasses(null);
      setViewMode("calendar");

      if (onScheduleUpdate) {
        onScheduleUpdate(validatedClasses);
      }
    } catch (error) {
      console.error("Error saving courses:", error);
      showErrorToast(`Failed to save courses: ${error.message}`);
    }
  };

  const handleBackToUpload = () => {
    setOcrParsedClasses(null);
    setCurrentSchedule(null);
    setViewMode("uploader");
  };

  const handleEditSchedule = () => {
    setOcrParsedClasses(currentSchedule);
    setViewMode("reviewer");
  };

  const handleImportSchedule = (importedSchedule) => {
    setCurrentSchedule(importedSchedule);
    setViewMode("display");
  };

  const renderContent = () => {
    if (isLoadingCourses) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your schedule...</p>
        </div>
      );
    }

    switch (viewMode) {
      case "calendar":
        return (
          <ScheduleCalendar
            courses={savedCourses || []}
            onEditSchedule={() => {
              console.log("Edit schedule clicked, clearing saved courses");
              setSavedCourses(null);
              setCurrentSchedule(null);
              setViewMode("uploader");
            }}
            userData={userData}
          />
        );
      case "uploader":
        return (
          <ScheduleUploader
            onScheduleParsed={handleScheduleParsed}
            onScheduleValidated={handleScheduleValidated}
            userId={userData?._id}
            userData={userData}
          />
        );
      case "reviewer":
        return (
          <ScheduleReviewForm
            initialClasses={ocrParsedClasses || []}
            onScheduleValidated={handleScheduleValidated}
            onBackToUpload={handleBackToUpload}
          />
        );
      case "display":
        return (
          <InteractiveScheduleDisplay
            schedule={currentSchedule || []}
            onEditSchedule={handleEditSchedule}
            onImportSchedule={handleImportSchedule}
          />
        );
      case "classes":
        return <ClassesPage />;
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
    { id: "dashboard", label: "Dashboard", icon: IconHome },
    { id: "classes", label: "Classes", icon: IconBook2 },
    { id: "bookmarks", label: "Bookmarked Courses", icon: IconBookmark },
    { id: "connections", label: "Connections", icon: IconUsers },
  ];

  const handleNavigation = (itemId) => {
    setActiveNavItem(itemId);

    switch (itemId) {
      case "connections":
        if (onNavigateToMatcher) onNavigateToMatcher();
        break;
      case "classes": // Handle navigation to classes page
        if (onNavigateToClasses) onNavigateToClasses();
        break;
      case "profile":
        if (onNavigateToProfileDetails) onNavigateToProfileDetails();
        break;
      case "bookmarks":
        if (onNavigateToBookmarks) onNavigateToBookmarks();
        break;
      default:
        break;
    }
  };

  const handleProfileClick = () => {
    if (onNavigateToProfileDetails) {
      onNavigateToProfileDetails();
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSettingsDropdown = () => {
    setShowSettingsDropdown((prev) => !prev);
  };


  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const closeSearchResults = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

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
        const searchParams = new URLSearchParams();
        searchParams.append("name", searchQuery.trim());
        if (userUniversity && userUniversity !== "Other") {
          searchParams.append("university", userUniversity);
        }

        const searchUrl = `/api/users/search?${searchParams.toString()}`;
        const response = await fetch(searchUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Search failed: ${response.status}`);
        }

        const data = await response.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchError(error.message);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, userUniversity]);

  const isEmail = (text) => /^[\w-.]+@[\w-.]+\.[\w-.]+$/.test(text);

  const displayName =
    userData?.profileCompleted === false && isEmail(userData?.name)
      ? "User"
      : userData?.name || "User";

  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h2>skedulr</h2>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
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
                    className={`nav-link ${activeNavItem === item.id ? "active" : ""}`}
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

      <div className="dashboard-main">
        <header className="dashboard-app-bar">
          <div className="app-bar-left">
            <button className="mobile-menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
              <IconMenu2 size={24} />
            </button>

            <div className="search-container">
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
                  onUserClick={onNavigateToProfileDetails}
                />
              )}
            </div>
          </div>

          <div className="app-bar-right">
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

            <div className="user-profile" onClick={handleProfileClick}>
              <div className="user-avatar">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-info">
                <span className="user-name">{userData?.name || "User"}</span>
                <span className="user-email">{userData?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="content-header">
            <h1 className="page-title">Welcome back, {displayName}!</h1>
            <p className="page-subtitle">Manage your academic schedule and connect with classmates</p>
          </div>

          <div className="content-body">{renderContent()}</div>
        </main>
      </div>

      <ChatSidebar userData={userData} />
      <ToastContainer />
    </div>
  );
};

export default DashboardPage;
