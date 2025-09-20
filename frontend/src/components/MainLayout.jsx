import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './MainLayout.css'; // We will create this CSS file next

/**
 * MainLayout component that provides a sidebar and renders nested route content.
 * @param {Object} props - The component props.
 * @param {Object} props.userData - The current user's data.
 * @param {function} props.onLogout - Function to handle user logout.
 */
const MainLayout = ({ userData, onLogout }) => {
  return (
    <div className="main-layout">
      <Sidebar userName={userData?.name || 'User'} onLogout={onLogout} />
      <div className="main-content-area">
        <Outlet context={{ onLogout }} /> {/* Pass onLogout via context */}
      </div>
    </div>
  );
};

export default MainLayout;
