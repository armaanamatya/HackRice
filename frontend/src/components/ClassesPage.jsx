import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CourseReportModal from './CourseReportModal';
import CourseCard from './shared/CourseCard';
import './ClassesPage.css';

const ClassesPage = ({ userData, onBackToDashboard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedCreditHours, setSelectedCreditHours] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [activeTab, setActiveTab] = useState('catalog');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    departments: [],
    universities: [],
    creditHours: []
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [bookmarkedCourses, setBookmarkedCourses] = useState([]);
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    loading: false,
    error: null,
    report: null
  });

  const ITEMS_PER_PAGE = 20;

  // Fetch enrolled courses from the user's schedule
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData?._id) return;

      try {
        // Fetch enrolled courses
        const enrolledResponse = await fetch(`/api/courses/${userData._id}`);
        if (enrolledResponse.ok) {
          const data = await enrolledResponse.json();
          setEnrolledCourses(data.courses || []);
        }

        // Fetch bookmarked courses
        const bookmarkedResponse = await fetch(`/api/bookmarks/${userData._id}`);
        if (bookmarkedResponse.ok) {
          const bookmarks = await bookmarkedResponse.json();
          setBookmarkedCourses(bookmarks || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userData]);

  // Memoized enrolled course codes for quick lookup
  const enrolledCourseCodes = useMemo(() => {
    return new Set(enrolledCourses.map(course => course.courseCode?.toUpperCase()));
  }, [enrolledCourses]);

  // Fetch courses from catalog
  const fetchCourses = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedDepartment !== 'all') params.append('department', selectedDepartment);
      if (selectedUniversity !== 'all') params.append('university', selectedUniversity);
      if (selectedCreditHours !== 'all') params.append('credit_hours', selectedCreditHours);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      params.append('page', page);
      params.append('limit', ITEMS_PER_PAGE);

      const response = await fetch(`/api/catalog?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setCurrentPage(data.page || 1);
      setFilters(data.filters || { departments: [], universities: [], creditHours: [] });
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDepartment, selectedUniversity, selectedCreditHours, selectedLevel]);

  // Fetch courses when filters change
  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchCourses(1);
    }
  }, [searchQuery, selectedDepartment, selectedUniversity, selectedCreditHours, selectedLevel, activeTab, fetchCourses]);

  // Handle page change
  const handlePageChange = (page) => {
    fetchCourses(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('all');
    setSelectedUniversity('all');
    setSelectedCreditHours('all');
    setSelectedLevel('all');
    setCurrentPage(1);
  };


  // Check if course is enrolled
  const isCourseEnrolled = (courseCode) => {
    return enrolledCourseCodes.has(courseCode?.toUpperCase());
  };

  // Generate course report
  const generateCourseReport = async (course) => {
    setReportModal({
      isOpen: true,
      loading: true,
      error: null,
      report: null
    });

    try {
      const params = new URLSearchParams();
      if (course.university) params.append('university', course.university);
      
      const response = await fetch(`/api/reports/${encodeURIComponent(course.code)}?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }
      
      const reportData = await response.json();
      
      setReportModal({
        isOpen: true,
        loading: false,
        error: null,
        report: reportData
      });
    } catch (error) {
      console.error('Error generating course report:', error);
      setReportModal({
        isOpen: true,
        loading: false,
        error: error.message,
        report: null
      });
    }
  };

  // Close report modal
  const closeReportModal = () => {
    setReportModal({
      isOpen: false,
      loading: false,
      error: null,
      report: null
    });
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (course) => {
    if (!userData?._id) return;

    const isCurrentlyBookmarked = bookmarkedCourses.some(
      bookmark => bookmark.course_code === course.code && bookmark.university === course.university
    );

    try {
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        await fetch(
          `/api/bookmarks/${userData._id}/${course.code}/${course.university}`,
          { method: 'DELETE' }
        );
        setBookmarkedCourses(prev => 
          prev.filter(b => b.course_code !== course.code || b.university !== course.university)
        );
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userData._id,
            courseCode: course.code,
            university: course.university
          })
        });
        const newBookmark = await response.json();
        setBookmarkedCourses(prev => [...prev, newBookmark]);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark. Please try again.');
    }
  };

  // Handle adding/updating note
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
        prev.map(b =>
          b.course_code === course.code && b.university === course.university
            ? updatedBookmark
            : b
        )
      );
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  return (
    <div className="classes-page">
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
      <div className="classes-header">
        <div className="header-content">
          <div className="hero-badge">
            <span className="badge-text">Course Discovery</span>
          </div>
          <h1 className="page-title">Course Catalog</h1>
          <p className="page-subtitle">
            Explore courses from multiple universities and track your enrolled classes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Course Catalog
          {total > 0 && <span className="tab-count">({total})</span>}
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'enrolled' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrolled')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          Currently Enrolled
          <span className="tab-count">({enrolledCourses.length})</span>
        </button>
      </div>

      {activeTab === 'catalog' && (
        <>
          {/* Search and Filters */}
          <div className="search-filters-section">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search courses by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="clear-search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="filters-row">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Departments</option>
                {filters.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Universities</option>
                {filters.universities.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>

              <select
                value={selectedCreditHours}
                onChange={(e) => setSelectedCreditHours(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Credit Hours</option>
                {filters.creditHours.map(hours => (
                  <option key={hours} value={hours}>{hours} Credits</option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Levels</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="freshman">Freshman (1000-level)</option>
                <option value="sophomore">Sophomore (2000-level)</option>
                <option value="junior">Junior (3000-level)</option>
                <option value="senior">Senior (4000-level)</option>
              </select>

              <button onClick={resetFilters} className="reset-filters-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1,4 1,10 7,10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Reset
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="results-section">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading courses...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p>Error: {error}</p>
                <button onClick={() => fetchCourses(currentPage)} className="retry-btn">
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="results-info">
                  <p>
                    {total > 0 
                      ? `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, total)} of ${total} courses`
                      : 'No courses found'
                    }
                  </p>
                </div>

                <div className="courses-grid">
                  {courses.map(course => (
                    <CourseCard 
                      key={`${course.code}-${course.university}`} 
                      course={course} 
                      isEnrolled={isCourseEnrolled(course.code)}
                      isBookmarked={bookmarkedCourses.some(
                        b => b.course_code === course.code && b.university === course.university
                      )}
                      onBookmarkToggle={handleBookmarkToggle}
                      onAddNote={handleAddNote}
                      userData={userData}
                      onClick={() => setSelectedCourse(course)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>
                    
                    <div className="pagination-info">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'enrolled' && (
        <div className="enrolled-section">
          <div className="enrolled-header">
            <h2>Your Enrolled Courses</h2>
            <p>Courses from your current schedule</p>
          </div>
          
          {enrolledCourses.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <h3>No enrolled courses</h3>
              <p>Upload your schedule to see your enrolled courses here</p>
            </div>
          ) : (
            <div className="enrolled-courses-grid">
              {enrolledCourses.map((course, index) => (
                <div key={`${course.id || index}`} className="enrolled-course-card">
                  <div className="course-header">
                    <h3 className="course-code">{course.courseCode}</h3>
                    <div className="course-schedule">
                      <div className="course-days">
                        {course.days?.join(', ')}
                      </div>
                      <div className="course-time">
                        {course.startTime} - {course.endTime}
                      </div>
                      {course.location && (
                        <div className="course-location">{course.location}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="course-modal-overlay" onClick={() => setSelectedCourse(null)}>
          <div className="course-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>{selectedCourse.code}</h2>
                <h3>{selectedCourse.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedCourse(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="course-details">
                <div className="detail-row">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{selectedCourse.department}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">University:</span>
                  <span className="detail-value">{selectedCourse.university}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Credit Hours:</span>
                  <span className="detail-value">{selectedCourse.credit_hours}</span>
                </div>
                {selectedCourse.prerequisites && selectedCourse.prerequisites !== 'None' && (
                  <div className="detail-row">
                    <span className="detail-label">Prerequisites:</span>
                    <span className="detail-value">{selectedCourse.prerequisites}</span>
                  </div>
                )}
              </div>
              
              <div className="course-description-full">
                <h4>Course Description</h4>
                <p>{selectedCourse.description}</p>
              </div>
              
              {isCourseEnrolled(selectedCourse.code) && (
                <div className="enrollment-status">
                  <div className="enrolled-indicator">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    You are currently enrolled in this course
                  </div>
                </div>
              )}
              
              {/* Report Generation Button */}
              <div className="modal-actions">
                <button 
                  onClick={() => generateCourseReport(selectedCourse)}
                  className="generate-report-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19c-5 0-8-1.344-8-3v-4.5c0-1.656 3-3 8-3s8 1.344 8 3V16c0 1.656-3 3-8 3z"/>
                    <path d="M9 11c5 0 8-1.344 8-3s-3-3-8-3-8 1.344-8 3 3 3 8 3z"/>
                    <circle cx="17" cy="4" r="3"/>
                    <path d="m21 7-6 6"/>
                  </svg>
                  Generate AI Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Course Report Modal */}
      <CourseReportModal
        report={reportModal.report}
        isOpen={reportModal.isOpen}
        onClose={closeReportModal}
        loading={reportModal.loading}
        error={reportModal.error}
      />
    </div>
  );
};

export default ClassesPage;
