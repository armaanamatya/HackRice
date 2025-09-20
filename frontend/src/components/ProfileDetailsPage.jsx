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
  IconUserCircle
} from '@tabler/icons-react';
import ProfileEditForm from "./ProfileEditForm";
import InteractiveScheduleDisplay from './InteractiveScheduleDisplay'; // Import InteractiveScheduleDisplay
import "./ProfileDetailsPage.css";
import { detectUniversityFromEmail } from "../utils/universityUtils";
import { useParams } from 'react-router-dom'; // Import useParams

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
const ProfileDetailsPage = ({ onBackToDashboard }) => {
  const { userId } = useParams(); // Get userId from URL parameters
  const [userProfile, setUserProfile] = useState(null); // Local state for the displayed user's profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }
        const data = await response.json();
        setUserProfile(data); // Set the fetched user data
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
          <h1 className="page-title">Loading Profile...</h1>
        </div>
        <div className="profile-content">
          <div className="empty-state">
            <IconUserCircle size={64} className="empty-icon" />
            <h3>Loading profile data...</h3>
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
          <div className="empty-state">
            <IconUserCircle size={64} className="empty-icon" />
            <h3>{error ? `Error: ${error}` : "No Profile Data"}</h3>
            <p>{error ? "Failed to load profile." : "No profile information is available at the moment."}</p>
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
                <div className="profile-avatar">
                  {userProfile.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="profile-basic-info">
                  <h2 className="profile-name">{userProfile.name || "Unknown User"}</h2>
                  <p className="profile-title">
                    {userProfile.year && userProfile.major 
                      ? `${userProfile.year} • ${userProfile.major}`
                      : userProfile.year || userProfile.major || "Student"
                    }
                  </p>
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

              {/* User Schedule Section */}
              {userProfile.schedule && userProfile.schedule.length > 0 && (
                <div className="profile-section">
                  <div className="section-header">
                    <IconCalendar size={20} className="section-icon" />
                    <h3 className="section-title">Schedule</h3>
                  </div>
                  <div className="schedule-display-wrapper">
                    <InteractiveScheduleDisplay 
                      schedule={userProfile.schedule} 
                      // No edit or import options for viewing another user's schedule
                      onEditSchedule={() => { /* no-op */ }} 
                      onImportSchedule={() => { /* no-op */ }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileDetailsPage;
