import React, { useState, useEffect } from 'react';
import ProfileEditForm from './ProfileEditForm'; // Import the new edit form
import './ProfileDetailsPage.css';

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
 * @param {function} props.setUserData - Function to update the global user data state.
 * @param {function} props.onLogout - Function to log out the user.
 */
const ProfileDetailsPage = ({ userData, setUserData, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfileData, setCurrentProfileData] = useState(userData); // Local state to manage profile data

  // Update local state if userData prop changes
  useEffect(() => {
    setCurrentProfileData(userData);
  }, [userData]);

  const handleProfileUpdated = (updatedData) => {
    setCurrentProfileData(updatedData); // Update local state with new data
    setUserData(updatedData); // Update global state in App.jsx
    setIsEditing(false); // Exit edit mode
  };

  const handleCancelEdit = () => {
    setIsEditing(false); // Exit edit mode without saving
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/users/${currentProfileData._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Account deleted successfully.');
          setUserData(null); // Clear user data from global state
          onLogout(); // Log out the user from Auth0
        } else {
          const data = await response.json();
          console.error('Account deletion failed:', data.message);
          alert(`Error deleting account: ${data.message}`);
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('An error occurred while deleting your account.');
      }
    }
  };

  if (!currentProfileData) {
    return (
      <div className="profile-details-container">
        <h2>Profile Details</h2>
        <p>No profile data available.</p>
      </div>
    );
  }

  return (
    <div className="profile-details-container">
      {isEditing ? (
        <ProfileEditForm
          initialData={currentProfileData}
          onProfileUpdated={handleProfileUpdated}
          onCancel={handleCancelEdit}
        />
      ) : (
        <>
          <h2>My Profile</h2>
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-initial-large">{currentProfileData.name?.charAt(0).toUpperCase() || 'U'}</div>
              <h3>{currentProfileData.name}</h3>
            </div>
            <div className="profile-info">
              <p><strong>Email:</strong> {currentProfileData.email || 'N/A'}</p>
              {currentProfileData.university && <p><strong>University:</strong> {currentProfileData.university}</p>}
              <p><strong>Age:</strong> {currentProfileData.age || 'N/A'}</p>
              <p><strong>Year:</strong> {currentProfileData.year || 'N/A'}</p>
              <p><strong>Major:</strong> {currentProfileData.major || 'N/A'}</p>
              <p><strong>Bio:</strong> {currentProfileData.bio || 'N/A'}</p>
            </div>
          </div>
          <div className="profile-actions">
            <button onClick={() => setIsEditing(true)} className="edit-profile-button">Edit Profile</button>
            <button onClick={handleDeleteAccount} className="delete-account-button">Delete Account</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileDetailsPage;
