import React, { useEffect } from 'react';
import { IconX, IconCalendar } from '@tabler/icons-react';
import ScheduleCalendar from './ScheduleCalendar';
import './SchedulePopup.css';

/**
 * SchedulePopup component displays a user's schedule in a modal popup
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the popup is open
 * @param {function} props.onClose - Function to close the popup
 * @param {Array} props.schedule - The user's schedule/courses
 * @param {Object} props.userData - User data for the schedule owner
 */
const SchedulePopup = ({ isOpen, onClose, schedule, userData }) => {
  // Handle ESC key press to close popup
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-popup-overlay" onClick={handleBackdropClick}>
      <div className="schedule-popup-container">
        {/* Popup Header */}
        <div className="schedule-popup-header">
          <div className="popup-header-info">
            <IconCalendar size={24} className="popup-header-icon" />
            <div>
              <h2 className="popup-title">
                {userData?.name ? `${userData.name}'s Schedule` : 'User Schedule'}
              </h2>
              <p className="popup-subtitle">
                {schedule?.length || 0} course{schedule?.length !== 1 ? 's' : ''} enrolled
              </p>
            </div>
          </div>
          <button 
            className="popup-close-button" 
            onClick={onClose}
            aria-label="Close schedule popup"
          >
            <IconX size={24} />
          </button>
        </div>

        {/* Popup Content */}
        <div className="schedule-popup-content">
          {schedule && schedule.length > 0 ? (
            <ScheduleCalendar
              courses={schedule}
              onEditSchedule={() => {}} // No-op for viewing others' schedules
              userData={userData}
              isPopupMode={true} // Flag to adjust styling for popup
              allowEditing={false} // Disable editing for other users' schedules
            />
          ) : (
            <div className="no-schedule-message">
              <IconCalendar size={48} className="no-schedule-icon" />
              <h3>No Schedule Available</h3>
              <p>This user hasn't uploaded their schedule yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulePopup;
