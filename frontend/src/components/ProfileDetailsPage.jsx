import React from 'react';
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
 * @param {function} props.onBackToDashboard - Function to navigate back to the dashboard.
 */
const ProfileDetailsPage = ({ userData, onBackToDashboard }) => {
  if (!userData) {
    return (
      <div className="profile-details-container">
        <h2>Profile Details</h2>
        <p>No profile data available.</p>
        <button onClick={onBackToDashboard} className="back-button">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="profile-details-container">
      <h2>My Profile</h2>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-initial-large">{userData.name?.charAt(0).toUpperCase() || 'U'}</div>
          <h3>{userData.name}</h3>
        </div>
        <div className="profile-info">
          <p><strong>Email:</strong> {userData.email || 'N/A'}</p>
          {userData.university && <p><strong>University:</strong> {userData.university}</p>}
          <p><strong>Age:</strong> {userData.age || 'N/A'}</p>
          <p><strong>Year:</strong> {userData.year || 'N/A'}</p>
          <p><strong>Major:</strong> {userData.major || 'N/A'}</p>
          <p><strong>Bio:</strong> {userData.bio || 'N/A'}</p>
        </div>
      </div>
      <button onClick={onBackToDashboard} className="back-button">Back to Dashboard</button>
    </div>
  );
};

export default ProfileDetailsPage;
