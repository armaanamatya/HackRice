import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';

/**
 * Sidebar component for navigation.
 * @param {Object} props - The component props.
 * @param {string} [props.userName] - The name of the logged-in user.
 * @param {function} props.onLogout - Function to handle user logout.
 */
const Sidebar = ({ userName, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo">Scedulr</Link>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-links">
          <li>
            <Link to="/dashboard" className="sidebar-nav-item">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/dashboard/matcher" className="sidebar-nav-item">
              Matcher
            </Link>
          </li>
          <li>
            <Link to="/dashboard/profile" className="sidebar-nav-item">
              Profile
            </Link>
          </li>
          <li>
            <Link to="#settings" className="sidebar-nav-item">
              Settings
            </Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        {userName && <p className="sidebar-user">Welcome, {userName}</p>}
        <button onClick={onLogout} className="sidebar-logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
