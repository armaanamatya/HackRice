import React, { useState, useEffect } from 'react';
import './ConnectionsPage.css';

const ConnectionsPage = ({ userData, onBackToDashboard }) => {
  const [matches, setMatches] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    major: '',
    year: '',
    university: ''
  });

  // Fetch schedule matches on component mount
  useEffect(() => {
    if (userData?._id) {
      fetchScheduleMatches();
    }
  }, [userData]);

  // Fetch schedule matches
  const fetchScheduleMatches = async () => {
    if (!userData?._id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/match-by-classes/${userData._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule matches');
      }

      const matchedUsers = await response.json();
      
      // Calculate match percentages based on common classes
      const processedMatches = matchedUsers.map(user => ({
        ...user,
        matchPercentage: calculateMatchPercentage(user.commonClassesCount)
      }));

      setMatches(processedMatches);
    } catch (err) {
      console.error('Error fetching schedule matches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate match percentage (simple algorithm)
  const calculateMatchPercentage = (commonClasses) => {
    // Assuming a typical student has 4-6 classes, calculate percentage
    const maxPossibleClasses = 6;
    return Math.min(Math.round((commonClasses / maxPossibleClasses) * 100), 100);
  };

  // Search users with filters
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('name', searchQuery);
      
      // Add user university for automatic filtering
      if (userData?.university) {
        params.append('userUniversity', userData.university);
      }
      
      if (filters.university) params.append('university', filters.university);
      
      const response = await fetch(`/api/users/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const users = await response.json();
      
      // Filter additional criteria client-side if needed
      let filteredUsers = users;
      
      if (filters.major) {
        filteredUsers = filteredUsers.filter(user => 
          user.major && user.major.toLowerCase().includes(filters.major.toLowerCase())
        );
      }
      
      if (filters.year) {
        filteredUsers = filteredUsers.filter(user => 
          user.year && user.year.toString() === filters.year
        );
      }

      setAllUsers(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    searchUsers();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      major: '',
      year: '',
      university: ''
    });
    setAllUsers([]);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle connect action (placeholder)
  const handleConnect = (user) => {
    console.log('Connect with:', user.name);
    // TODO: Implement connection/messaging functionality
    alert(`Connection request sent to ${user.name}!`);
  };

  return (
    <div className="connections-page">
      {/* Fixed Back Button */}
      {onBackToDashboard && (
        <button onClick={onBackToDashboard} className="back-to-dashboard-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)"/>
          </svg>
          Back to Dashboard
        </button>
      )}

      {/* Header */}
      <div className="connections-header">
        <div className="header-content">
          <div className="hero-badge">
            <span className="badge-text">Connect & Network</span>
          </div>
          <h1 className="page-title">Connections</h1>
          <p className="page-subtitle">
            Find classmates and connect with students who share your courses and interests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Schedule Matches
          {matches.length > 0 && <span className="tab-count">({matches.length})</span>}
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          Find People
          {allUsers.length > 0 && <span className="tab-count">({allUsers.length})</span>}
        </button>
      </div>

      {/* Schedule Matches Tab */}
      {activeTab === 'matches' && (
        <div className="matches-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Finding your classmates...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Error: {error}</p>
              <button onClick={fetchScheduleMatches} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <h3>No matches found</h3>
              <p>Upload your schedule to find classmates with similar courses</p>
            </div>
          ) : (
            <div className="matches-grid">
              {matches.map((match, index) => (
                <div key={match._id} className="match-card">
                  <div className="match-header">
                    <div className="user-avatar">
                      {getInitials(match.name)}
                    </div>
                    <div className="user-info">
                      <h3 className="user-name">{match.name}</h3>
                      <p className="user-details">
                        {match.major && `${match.major} • `}
                        {match.year && `Year ${match.year}`}
                      </p>
                    </div>
                    <div className="match-percentage">
                      <span className="percentage-value">{match.matchPercentage}%</span>
                      <span className="percentage-label">Match</span>
                    </div>
                  </div>
                  
                  <div className="common-classes">
                    <h4>Shared Classes ({match.commonClassesCount})</h4>
                    <div className="classes-list">
                      {match.commonClasses.map((course, idx) => (
                        <span key={idx} className="class-tag">
                          {course.courseCode}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="match-actions">
                    <button 
                      className="connect-btn"
                      onClick={() => handleConnect(match)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="search-section">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or major..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="clear-search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="filters-row">
              <select
                value={filters.major}
                onChange={(e) => setFilters({...filters, major: e.target.value})}
                className="filter-select"
              >
                <option value="">All Majors</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Biology">Biology</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>

              <select
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
                className="filter-select"
              >
                <option value="">All Years</option>
                <option value="1">Freshman</option>
                <option value="2">Sophomore</option>
                <option value="3">Junior</option>
                <option value="4">Senior</option>
                <option value="5">Graduate</option>
              </select>

              <button type="button" onClick={resetFilters} className="reset-filters-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1,4 1,10 7,10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Reset
              </button>
            </div>

            <button type="submit" className="search-submit-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              Search
            </button>
          </form>

          {/* Search Results */}
          <div className="search-results">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Searching for people...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p>Error: {error}</p>
                <button onClick={searchUsers} className="retry-btn">
                  Try Again
                </button>
              </div>
            ) : allUsers.length === 0 && searchQuery ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
                <h3>No results found</h3>
                <p>Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="users-grid">
                {allUsers.map((user) => (
                  <div key={user._id} className="user-card">
                    <div className="user-header">
                      <div className="user-avatar">
                        {getInitials(user.name)}
                      </div>
                      <div className="user-info">
                        <h3 className="user-name">{user.name}</h3>
                        <p className="user-details">
                          {user.major && `${user.major}`}
                          {user.major && user.year && ` • `}
                          {user.year && `Year ${user.year}`}
                        </p>
                        {user.university && (
                          <p className="user-university">{user.university}</p>
                        )}
                      </div>
                    </div>

                    <div className="user-actions">
                      <button 
                        className="connect-btn"
                        onClick={() => handleConnect(user)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        Connect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionsPage;