import React from 'react';
import './ProfilePicture.css';

const ProfilePicture = ({ 
  src, 
  alt, 
  size = 'medium', 
  fallbackText, 
  className = '',
  onClick,
  showEditOverlay = false
}) => {
  const getInitials = (text) => {
    if (!text) return 'U';
    return text
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClass = `profile-picture-${size}`;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const imageUrl = src ? `${baseUrl}${src}` : null;

  return (
    <div 
      className={`profile-picture ${sizeClass} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={alt || 'Profile picture'} 
          className="profile-picture-image"
          onError={(e) => {
            // If image fails to load, hide it and show fallback
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div 
        className="profile-picture-fallback"
        style={{ display: imageUrl ? 'none' : 'flex' }}
      >
        {getInitials(fallbackText)}
      </div>
      
      {showEditOverlay && (
        <div className="profile-picture-edit-overlay">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </div>
      )}
    </div>
  );
};

export default ProfilePicture;
