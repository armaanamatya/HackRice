import React, { useState, useEffect } from "react";
import { 
  IconUser, 
  IconMail, 
  IconSchool, 
  IconCalendar, 
  IconBook2, 
  IconFileText, 
  IconEdit, 
  IconArrowLeft,
  IconMapPin,
  IconUserCircle,
  IconEye
} from '@tabler/icons-react';
import ProfileEditForm from "./ProfileEditForm";
import SchedulePopup from './SchedulePopup'; // Import SchedulePopup instead
import ProfilePicture from './ProfilePicture';
import ProfilePictureUpload from './ProfilePictureUpload';
import "./ProfileDetailsPage.css";
import { useParams } from 'react-router-dom'; // Import useParams
import { isSchedulePubliclyVisible } from '../utils/settingsUtils'; // Import the new utility

/**
 * @typedef {Object} UserProfileData
 * @property {string} name - The user's name.
 * @property {number} age - The user's age.
 * @property {string} year - The user's academic year (Freshman, Sophomore, etc.).
 * @property {string} major - The user's major.
 * @property {string} bio - A short biography of the user.
 * @property {string} [email] - The user's email address (optional).
 * @property {string} [university] - The user's university (optional, detected from email).
 */

/**
 * ProfileDetailsPage component displays the user's detailed profile information.
 * @param {Object} props - The component props.
 * @param {UserProfileData} props.userData - The user's profile data.
 * @param {function} props.onBackToDashboard - Function to navigate back to the dashboard.
 * @param {function} props.setUserData - Function to update the user data in the parent component.
 */
const ProfileDetailsPage = ({ onBackToDashboard, onUserDataUpdate, currentUserData }) => {
  const { userId: rawUserId } = useParams(); // Get userId from URL parameters
  const userId = rawUserId ? decodeURIComponent(rawUserId) : null; // Decode URL-encoded userId
  
  // Debug logging - can be removed later
  console.log('ProfileDetailsPage - Loading profile for userId:', userId);
  
  const [userProfile, setUserProfile] = useState(null); // Local state for the displayed user's profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false); // State for popup
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Use the decoded userId directly
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }
        const userData = await response.json();

        // Fetch user schedule
        const scheduleResponse = await fetch(`/api/courses/${userId}`);
        if (!scheduleResponse.ok) {
          // Silently handle schedule not found - user may not have uploaded one yet
          userData.schedule = []; // Set empty schedule if not found
        } else {
          const scheduleData = await scheduleResponse.json();
          userData.schedule = scheduleData.courses || [];
        }

        setUserProfile(userData); // Set the fetched user data including schedule
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    } else {
      // Handle case where no userId is provided (e.g., current user's profile)
      // This assumes userData is passed for the current user if no userId in URL
      // For now, if no userId, we'll show no data. This might need refinement.
      setLoading(false);
      setError("No user ID provided.");
    }
  }, [userId]);

  // Check if schedule should be visible based on privacy settings
  const shouldShowSchedule = userProfile && isSchedulePubliclyVisible(
    userProfile._id || userProfile.id, 
    currentUserData?._id || currentUserData?.id
  );

  // Handle profile picture upload success
  const handleUploadSuccess = (profilePictureUrl) => {
    setUserProfile(prev => ({
      ...prev,
      profilePicture: profilePictureUrl
    }));
    
    // If this is the current user's profile, update the global userData as well
    if (currentUserData && userProfile && currentUserData._id === userProfile._id && onUserDataUpdate) {
      onUserDataUpdate({
        ...currentUserData,
        profilePicture: profilePictureUrl
      });
    }
    
    const message = profilePictureUrl 
      ? 'Profile picture updated successfully!' 
      : 'Profile picture removed successfully!';
    setUploadMessage(message);
    setUploadError(null);
    // Clear message after 3 seconds
    setTimeout(() => setUploadMessage(null), 3000);
  };

  // Handle profile picture upload error
  const handleUploadError = (errorMessage) => {
    setUploadError(errorMessage);
    setUploadMessage(null);
    // Clear error after 5 seconds
    setTimeout(() => setUploadError(null), 5000);
  };

  // Old useEffect for university detection - no longer needed if backend handles this
  /*
  useEffect(() => {
    if (userProfile && userProfile.email && !userProfile.university) {
      const detectedUniversity = detectUniversityFromEmail(userProfile.email);
      if (detectedUniversity) {
        setUserProfile((prevData) => ({
          ...prevData,
          university: detectedUniversity,
        }));
      }
    }
  }, [userProfile]);
  */

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button onClick={onBackToDashboard} className="back-button">
            <IconArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">Profile</h1>
        </div>
        <div className="profile-content">
          <div className="loading-state">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-content">
                <h3>Loading Profile</h3>
                <p>Please wait while we fetch the profile information...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button onClick={onBackToDashboard} className="back-button">
            <IconArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">Profile</h1>
        </div>
        <div className="profile-content">
          <div className="error-state">
            <div className="error-container">
              <div className="error-icon">
                <IconUserCircle size={48} />
              </div>
              <div className="error-content">
                <h3>{error ? "Unable to Load Profile" : "No Profile Data"}</h3>
                <p>{error ? error : "No profile information is available at the moment."}</p>
                {error && (
                  <button 
                    onClick={() => window.location.reload()} 
                    className="retry-button"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profileFields = [
    {
      icon: IconUser,
      label: "Name",
      value: userProfile.name || "Not provided",
      type: "text"
    },
    {
      icon: IconMail,
      label: "Email",
      value: userProfile.email || "Not provided",
      type: "email"
    },
    {
      icon: IconSchool,
      label: "University",
      value: userProfile.university || "Not specified",
      type: "text"
    },
    {
      icon: IconCalendar,
      label: "Age",
      value: userProfile.age ? `${userProfile.age} years old` : "Not specified",
      type: "number"
    },
    {
      icon: IconMapPin,
      label: "Academic Year",
      value: userProfile.year || "Not specified",
      type: "text"
    },
    {
      icon: IconBook2,
      label: "Major",
      value: userProfile.major || "Not specified",
      type: "text"
    }
  ];

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button onClick={onBackToDashboard} className="back-button">
          <IconArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="page-title">{userProfile.name}'s Profile</h1>
        <button 
          className="edit-button"
          onClick={() => setIsEditing(!isEditing)}
        >
          <IconEdit size={20} />
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      <div className="profile-content">
        {isEditing ? (
          <ProfileEditForm 
            initialData={userProfile}
            onProfileUpdated={(updatedData) => {
              setUserProfile(updatedData); // Update local user data
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            {/* Profile Overview Card */}
            <div className="profile-overview-card">
              <div className="profile-avatar-section">
                <div className="profile-avatar-container">
                  <ProfilePictureUpload
                    currentPicture={userProfile.profilePicture}
                    fallbackText={userProfile.name}
                    userId={userProfile._id}
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    size="xlarge"
                  />
                </div>
                <div className="profile-basic-info">
                  <h2 className="profile-name">{userProfile.name || "Unknown User"}</h2>
                  <p className="profile-title">
                    {userProfile.year && userProfile.major 
                      ? `${userProfile.year} • ${userProfile.major}`
                      : userProfile.year || userProfile.major || "Student"
                    }
                  </p>
                  
                  {/* Upload status messages */}
                  {uploadMessage && (
                    <div className="upload-message success">
                      {uploadMessage}
                    </div>
                  )}
                  {uploadError && (
                    <div className="upload-message error">
                      {uploadError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="profile-details-grid">
              <div className="profile-section">
                <div className="section-header">
                  <IconUser size={20} className="section-icon" />
                  <h3 className="section-title">Personal Information</h3>
                </div>
                <div className="profile-fields">
                  {profileFields.map((field, index) => {
                    const IconComponent = field.icon;
                    return (
                      <div key={index} className="profile-field">
                        <div className="field-icon">
                          <IconComponent size={18} />
                        </div>
                        <div className="field-content">
                          <label className="field-label">{field.label}</label>
                          <span className="field-value">{field.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bio Section */}
              {userProfile.bio && (
                <div className="profile-section">
                  <div className="section-header">
                    <IconFileText size={20} className="section-icon" />
                    <h3 className="section-title">About Me</h3>
                  </div>
                  <div className="bio-content">
                    <p>{userProfile.bio}</p>
                  </div>
                </div>
              )}

              {/* User Schedule Section - Moved below About Me */}
              {shouldShowSchedule ? (
                userProfile.schedule && userProfile.schedule.length > 0 ? (
                  <div className="profile-section">
                    <div className="section-header">
                      <IconCalendar size={20} className="section-icon" />
                      <h3 className="section-title">Schedule</h3>
                    </div>
                    <div className="schedule-preview-wrapper">
                      <div className="schedule-preview-card">
                        <div className="schedule-stats">
                          <div className="stat-item">
                            <span className="stat-number">{userProfile.schedule.length}</span>
                            <span className="stat-label">Courses</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">
                              {new Set(userProfile.schedule.map(course => course.days?.join('') || '')).size}
                            </span>
                            <span className="stat-label">Days</span>
                          </div>
                        </div>
                        <button 
                          className="view-schedule-button"
                          onClick={() => setShowSchedulePopup(true)}
                        >
                          <IconEye size={18} />
                          View Full Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="profile-section">
                    <div className="section-header">
                      <IconCalendar size={20} className="section-icon" />
                      <h3 className="section-title">Schedule</h3>
                    </div>
                    <div className="no-schedule-available">
                      <p>This user hasn't uploaded their schedule yet.</p>
                    </div>
                  </div>
                )
              ) : (
                // Show message when schedule is private
                userId !== (currentUserData?._id || currentUserData?.id) && (
                  <div className="profile-section">
                    <div className="section-header">
                      <IconCalendar size={20} className="section-icon" />
                      <h3 className="section-title">Schedule</h3>
                    </div>
                    <div className="no-schedule-available">
                      <p>This user has chosen to keep their schedule private.</p>
                    </div>
                  </div>
                )
              )}

              {/* Interests Section */}
              {userProfile.interests && userProfile.interests.length > 0 && (
                <div className="profile-section">
                  <div className="section-header">
                    <IconUserCircle size={20} className="section-icon" />
                    <h3 className="section-title">Interests</h3>
                  </div>
                  <div className="interests-content">
                    {userProfile.interests.map((interest, index) => (
                      <span key={index} className="interest-tag">{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Schedule Popup */}
      {shouldShowSchedule && (
        <SchedulePopup
          isOpen={showSchedulePopup}
          onClose={() => setShowSchedulePopup(false)}
          schedule={userProfile?.schedule || []}
          userData={userProfile}
        />
      )}
    </div>
  );
};

export default ProfileDetailsPage;
