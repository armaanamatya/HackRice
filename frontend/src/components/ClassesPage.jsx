import React from 'react';
import { IconBook2, IconClock, IconMapPin, IconUser } from '@tabler/icons-react';
import './ClassesPage.css';

const ClassesPage = ({ userSchedule }) => {
  if (!userSchedule || userSchedule.length === 0) {
    return (
      <div className="classes-page-container">
        <h1>Your Classes</h1>
        <p>You currently have no classes in your schedule. Please upload your schedule on the Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="classes-page-container">
      <h1>Your Classes</h1>
      <p>Here's an overview of your current classes.</p>
      <div className="class-list">
        {userSchedule.map((classItem, index) => (
          <div key={index} className="class-card">
            <h2 className="class-name"><IconBook2 size={20} /> {classItem.course}</h2>
            <div className="class-details">
              <p><IconClock size={16} /> {classItem.startTime} - {classItem.endTime}</p>
              <p><IconMapPin size={16} /> {classItem.location || 'N/A'}</p>
              <p><IconUser size={16} /> {classItem.instructor || 'N/A'}</p>
              <p className="class-days">Days: {classItem.days.join(', ')}</p>
            </div>
            {/* Future: Add button to view class details, study groups, etc. */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassesPage;
