import React, { useState, useRef } from 'react';
import ProfilePicture from './ProfilePicture';
import './ProfilePictureUpload.css';

const ProfilePictureUpload = ({ 
  currentPicture, 
  fallbackText, 
  userId, 
  onUploadSuccess, 
  onUploadError,
  size = 'large'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError?.('Please select an image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError?.('File size must be less than 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch(`/api/users/upload-profile-picture/${userId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const result = await response.json();
      setPreviewUrl(null); // Clear preview since we now have the real image
      onUploadSuccess?.(result.profilePicture, result.user);
    } catch (error) {
      console.error('Upload error:', error);
      setPreviewUrl(null); // Clear preview on error
      onUploadError?.(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePicture = async () => {
    if (!currentPicture) return;

    setIsUploading(true);
    
    try {
      const response = await fetch(`/api/users/delete-profile-picture/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile picture');
      }

      const result = await response.json();
      onUploadSuccess?.(null, result.user);
    } catch (error) {
      console.error('Delete error:', error);
      onUploadError?.(error.message || 'Failed to delete profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="profile-picture-upload">
      <div className="profile-picture-container">
        <ProfilePicture
          src={previewUrl ? null : currentPicture}
          fallbackText={fallbackText}
          size={size}
          className="upload-profile-picture"
          onClick={handleClick}
          showEditOverlay={!isUploading}
        />
        
        {previewUrl && (
          <div className="profile-picture-preview">
            <img src={previewUrl} alt="Preview" />
          </div>
        )}
        
        {isUploading && (
          <div className="upload-overlay">
            <div className="upload-spinner"></div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div className="upload-actions">
        <button 
          className="upload-btn primary"
          onClick={handleClick}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Change Picture'}
        </button>
        
        {currentPicture && (
          <button 
            className="upload-btn secondary"
            onClick={handleDeletePicture}
            disabled={isUploading}
          >
            Remove Picture
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
