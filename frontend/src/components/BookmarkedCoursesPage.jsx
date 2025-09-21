import React, { useState, useEffect } from 'react';
import CourseCard from './CourseCard';
import './BookmarkedCoursesPage.css';

const BookmarkedCoursesPage = ({ userData, onBackToDashboard }) => {
  const [bookmarkedCourses, setBookmarkedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookmarkedCourses();
  }, [userData?._id]);

  const fetchBookmarkedCourses = async () => {
    if (!userData?._id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/bookmarks/${userData._id}`);
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      
      const bookmarks = await response.json();
      
      // Fetch full course details for each bookmark
      const coursesPromises = bookmarks.map(bookmark =>
        fetch(`/api/catalog/${bookmark.course_code}`).then(res => res.json())
      );
      
      const courses = await Promise.all(coursesPromises);
      
      // Combine course details with bookmark data
      const bookmarkedCourses = courses.map((course, index) => ({
        ...course,
        bookmarkId: bookmarks[index]._id,
        notes: bookmarks[index].notes,
        added_date: bookmarks[index].added_date
      }));

      setBookmarkedCourses(bookmarkedCourses);
    } catch (err) {
      console.error('Error fetching bookmarked courses:', err);
      setError('Failed to load bookmarked courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (course) => {
    if (!userData?._id) return;

    try {
      const response = await fetch(
        `/api/bookmarks/${userData._id}/${course.code}/${course.university}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove bookmark');

      setBookmarkedCourses(prev => 
        prev.filter(c => c.code !== course.code || c.university !== course.university)
      );
    } catch (err) {
      console.error('Error removing bookmark:', err);
      alert('Failed to remove bookmark. Please try again.');
    }
  };

  const handleAddNote = async (course, note) => {
    if (!userData?._id) return;

    try {
      const response = await fetch(
        `/api/bookmarks/${userData._id}/${course.code}/${course.university}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notes: note })
        }
      );

      if (!response.ok) throw new Error('Failed to update note');

      const updatedBookmark = await response.json();
      
      setBookmarkedCourses(prev =>
        prev.map(c =>
          c.code === course.code && c.university === course.university
            ? { ...c, notes: updatedBookmark.notes }
            : c
        )
      );
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="bookmarked-courses-page">
        <div className="loading">Loading bookmarked courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookmarked-courses-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="bookmarked-courses-page">
      <div className="page-header">
        <button className="back-button" onClick={onBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Bookmarked Courses</h1>
      </div>

      {bookmarkedCourses.length === 0 ? (
        <div className="empty-state">
          <h2>No bookmarked courses yet</h2>
          <p>Start bookmarking courses you're interested in taking in the future!</p>
        </div>
      ) : (
        <div className="courses-grid">
          {bookmarkedCourses.map(course => (
            <CourseCard
              key={`${course.code}-${course.university}`}
              course={course}
              isBookmarked={true}
              onBookmarkToggle={() => handleRemoveBookmark(course)}
              onAddNote={handleAddNote}
              userData={userData}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkedCoursesPage;
