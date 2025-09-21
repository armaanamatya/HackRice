import React, { useState } from 'react';
import { IconBookmark, IconBookmarkFilled, IconNotes } from '@tabler/icons-react';
import './CourseCard.css';

const CourseCard = ({ 
  course, 
  isEnrolled = false, 
  isBookmarked = false,
  onBookmarkToggle,
  onAddNote,
  showBookmark = true,
  userData,
  onClick
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBookmarkClick = async (e) => {
    e.stopPropagation(); // Prevent card click event
    if (!userData) {
      // Show login prompt if user is not logged in
      alert('Please log in to bookmark courses');
      return;
    }
    onBookmarkToggle(course);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsSubmitting(true);
    try {
      await onAddNote(course, note);
      setShowNoteInput(false);
      setNote('');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNoteClick = (e) => {
    e.stopPropagation();
    setShowNoteInput(!showNoteInput);
  };

  return (
    <div 
      className={`course-card ${isEnrolled ? 'enrolled' : ''}`}
      onClick={onClick}
    >
      <div className="course-header">
        <div className="course-code-title">
          <h3 className="course-code">{course.code}</h3>
          <h4 className="course-title">{course.title}</h4>
        </div>
        <div className="course-badges">
          {isEnrolled && (
            <span className="enrolled-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              Enrolled
            </span>
          )}
          {showBookmark && (
            <button 
              className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmarkClick}
              title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
            >
              {isBookmarked ? (
                <IconBookmarkFilled size={20} />
              ) : (
                <IconBookmark size={20} />
              )}
            </button>
          )}
          {isBookmarked && (
            <button
              className="note-button"
              onClick={handleNoteClick}
              title="Add/edit note"
            >
              <IconNotes size={20} />
            </button>
          )}
        </div>
      </div>
      
      <div className="course-meta">
        <span className="department">{course.department}</span>
        <span className="university">{course.university}</span>
        <span className="credit-hours">{course.credit_hours} Credit Hours</span>
      </div>
      
      <p className="course-description">{course.description}</p>
      
      {course.prerequisites && course.prerequisites !== 'None' && (
        <div className="prerequisites">
          <strong>Prerequisites:</strong> {course.prerequisites}
        </div>
      )}

      {showNoteInput && (
        <form className="note-form" onSubmit={handleNoteSubmit} onClick={e => e.stopPropagation()}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this course..."
            rows="3"
            disabled={isSubmitting}
          />
          <div className="note-actions">
            <button type="button" onClick={() => setShowNoteInput(false)}>Cancel</button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CourseCard;
