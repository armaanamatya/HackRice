import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchResultsDropdown.css';

const SearchResultsDropdown = ({ results, isLoading, error, onClose, onUserClick }) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleUserClick = (userId) => {
    onUserClick(userId);
    onClose(); // Close dropdown after navigation
  };

  if (isLoading) {
    return (
      <div className="search-results-dropdown" ref={dropdownRef}>
        <div className="search-message">Searching...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results-dropdown" ref={dropdownRef}>
        <div className="search-message error">Error: {error}</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="search-results-dropdown" ref={dropdownRef}>
        <div className="search-message">No users found.</div>
      </div>
    );
  }

  return (
    <div className="search-results-dropdown" ref={dropdownRef}>
      {results.map((user) => (
        <div key={user._id} className="search-result-item" onClick={() => handleUserClick(user._id)}>
          <div className="user-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-university">{user.university}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResultsDropdown;
