import React, { useState, useEffect, useRef } from 'react';
import './UserSearch.css';

const UserSearch = ({ onUserSelect, onClose, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    // Focus search input when modal opens
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/chat/users/search?query=${encodeURIComponent(query)}&excludeUserId=${currentUserId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const users = await response.json();
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  const handleUserClick = (user) => {
    onUserSelect(user);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getUniversityLogo = (university) => {
    // Simple mapping of universities to their logos
    const logoMap = {
      'University of Houston': '/University_of_Houston_Logo.svg',
      'Rice University': '/Rice.webp',
      'University of Texas at Dallas': '/UT_Dallas.png'
    };
    return logoMap[university] || null;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="user-search-modal" onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h3>Start New Conversation</h3>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="search-section">
          <div className="search-input-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for students by name or email..."
              className="search-input"
            />
            {isLoading && (
              <div className="search-loading">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="search-error">
              {error}
            </div>
          )}
        </div>

        <div className="search-results">
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <div className="search-hint">
              Type at least 2 characters to search
            </div>
          )}
          
          {searchQuery.length >= 2 && searchResults.length === 0 && !isLoading && !error && (
            <div className="no-results">
              No students found matching "{searchQuery}"
            </div>
          )}
          
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="user-result"
              onClick={() => handleUserClick(user)}
            >
              <div className="user-avatar">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="user-info">
                <div className="user-primary">
                  <h4 className="user-name">{user.name}</h4>
                  <span className="user-email">{user.email}</span>
                </div>
                
                <div className="user-secondary">
                  {user.university && (
                    <div className="user-university">
                      {getUniversityLogo(user.university) && (
                        <img 
                          src={getUniversityLogo(user.university)} 
                          alt={user.university}
                          className="university-logo"
                        />
                      )}
                      <span>{user.university}</span>
                    </div>
                  )}
                  
                  {user.major && user.year && (
                    <div className="user-academic">
                      <span>{user.major}</span>
                      {user.year && <span> • Year {user.year}</span>}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="user-action">
                <button className="btn-message">
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div className="modal-footer">
            <small>
              Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;