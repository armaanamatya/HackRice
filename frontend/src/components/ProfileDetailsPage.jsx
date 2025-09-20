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
import "./ProfileDetailsPage.css";
import { detectUniversityFromEmail } from "../utils/universityUtils";

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
const ProfileDetailsPage = ({ userData, setUserData, onBackToDashboard }) => {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userData && userData.email && !userData.university) {
      const detectedUniversity = detectUniversityFromEmail(userData.email);
      if (detectedUniversity) {
        setUserData((prevData) => ({
          ...prevData,
          university: detectedUniversity,
        }));
      }
    }
  }, [userData, setUserData]);

  if (!userData) {
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
            <h3>No Profile Data</h3>
            <p>No profile information is available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  const profileFields = [
    {
      icon: IconUser,
      label: "Name",
      value: userData.name || "Not provided",
      type: "text"
    },
    {
      icon: IconMail,
      label: "Email",
      value: userData.email || "Not provided",
      type: "email"
    },
    {
      icon: IconSchool,
      label: "University",
      value: userData.university || "Not specified",
      type: "text"
    },
    {
      icon: IconCalendar,
      label: "Age",
      value: userData.age ? `${userData.age} years old` : "Not specified",
      type: "number"
    },
    {
      icon: IconMapPin,
      label: "Academic Year",
      value: userData.year || "Not specified",
      type: "text"
    },
    {
      icon: IconBook2,
      label: "Major",
      value: userData.major || "Not specified",
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
        <h1 className="page-title">My Profile</h1>
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
            initialData={userData}
            onProfileUpdated={(updatedData) => {
              setUserData(updatedData); // Update user data in parent state
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
                  {userData.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="profile-basic-info">
                  <h2 className="profile-name">{userData.name || "Unknown User"}</h2>
                  <p className="profile-title">
                    {userData.year && userData.major 
                      ? `${userData.year} • ${userData.major}`
                      : userData.year || userData.major || "Student"
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
              {userData.bio && (
                <div className="profile-section">
                  <div className="section-header">
                    <IconFileText size={20} className="section-icon" />
                    <h3 className="section-title">About Me</h3>
                  </div>
                  <div className="bio-content">
                    <p>{userData.bio}</p>
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
