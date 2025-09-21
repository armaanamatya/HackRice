import React from 'react';
import { 
  getDifficultyColor, 
  getCareerRelevanceColor, 
  getRatingStars,
  getReportSectionNames 
} from '../types/courseReport';
import './CourseReportModal.css';

const CourseReportModal = ({ report, isOpen, onClose, loading, error }) => {
  if (!isOpen) return null;

  const StarRating = ({ rating, size = 16 }) => {
    const stars = getRatingStars(rating);
    
    return (
      <div className="star-rating" style={{ fontSize: `${size}px` }}>
        {[...Array(stars.fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star full">★</span>
        ))}
        {stars.hasHalfStar && <span className="star half">★</span>}
        {[...Array(stars.emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">☆</span>
        ))}
        <span className="rating-value">({rating})</span>
      </div>
    );
  };

  const DifficultyMeter = ({ rating }) => {
    const numRating = parseInt(rating);
    const percentage = (numRating / 10) * 100;
    const color = getDifficultyColor(rating);
    
    return (
      <div className="difficulty-meter">
        <div className="meter-track">
          <div 
            className="meter-fill" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        <span className="meter-label">{rating}/10</span>
      </div>
    );
  };

  const CareerRelevanceMeter = ({ rating }) => {
    const numRating = parseInt(rating);
    const percentage = (numRating / 10) * 100;
    const color = getCareerRelevanceColor(rating);
    
    return (
      <div className="career-relevance-meter">
        <div className="meter-track">
          <div 
            className="meter-fill" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        <span className="meter-label">{rating}/10</span>
      </div>
    );
  };

  const GradeDistributionChart = ({ distribution }) => {
    const total = Object.values(distribution).reduce((sum, val) => sum + parseInt(val || 0), 0);
    
    return (
      <div className="grade-distribution">
        <div className="grade-bars">
          {Object.entries(distribution).map(([grade, percentage]) => {
            const width = total > 0 ? (parseInt(percentage || 0) / total) * 100 : 0;
            const colors = {
              'A': '#10b981',
              'B': '#3b82f6', 
              'C': '#f59e0b',
              'D/F': '#ef4444'
            };
            
            return (
              <div key={grade} className="grade-bar">
                <div className="grade-label">{grade}</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${width}%`, backgroundColor: colors[grade] }}
                  />
                </div>
                <div className="grade-percentage">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Section = ({ title, children, icon }) => (
    <div className="report-section">
      <div className="section-header">
        {icon && <span className="section-icon">{icon}</span>}
        <h3 className="section-title">{title}</h3>
      </div>
      <div className="section-content">
        {children}
      </div>
    </div>
  );

  const ListItem = ({ items, type = 'bullet' }) => (
    <ul className={`report-list ${type}`}>
      {items?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );

  if (loading) {
    return (
      <div className="report-modal-overlay">
        <div className="report-modal loading">
          <div className="loading-container">
            <div className="loading-spinner large"></div>
            <h3>Generating Course Report</h3>
            <p>AI is researching course details, professor ratings, and career insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-modal-overlay">
        <div className="report-modal error">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Report Generation Failed</h3>
            <p>{error}</p>
            <button onClick={onClose} className="close-btn">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="report-header">
          <div className="report-title-section">
            <h1 className="report-course-code">{report.metadata?.courseCode}</h1>
            <h2 className="report-course-name">{report.metadata?.courseName}</h2>
            <div className="report-meta">
              <span className="university">{report.metadata?.university}</span>
              <span className="department">{report.metadata?.department}</span>
              {report.cached && (
                <span className="cached-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                  Cached Report
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="report-close-btn">×</button>
        </div>

        {/* Report Content */}
        <div className="report-content">
          {/* Overview Section */}
          <Section title="Course Overview" icon="📋">
            <p className="overview-summary">{report.overview?.summary}</p>
            
            <div className="overview-grid">
              <div className="overview-card">
                <h4>Learning Objectives</h4>
                <ListItem items={report.overview?.learningObjectives} />
              </div>
              <div className="overview-card">
                <h4>Primary Topics</h4>
                <ListItem items={report.overview?.primaryTopics} />
              </div>
            </div>
          </Section>

          {/* Difficulty Section */}
          <Section title="Difficulty Analysis" icon="📊">
            <div className="difficulty-grid">
              <div className="difficulty-card">
                <h4>Difficulty Rating</h4>
                <DifficultyMeter rating={report.difficulty?.difficultyRating} />
              </div>
              <div className="difficulty-card">
                <h4>Weekly Workload</h4>
                <div className="workload-display">
                  <span className="workload-hours">{report.difficulty?.workloadHours}</span>
                  <span className="workload-label">hours/week</span>
                </div>
              </div>
            </div>
            
            <div className="difficulty-details">
              <div className="detail-card">
                <h4>Challenge Factors</h4>
                <ListItem items={report.difficulty?.difficultyFactors} />
              </div>
              <div className="detail-card">
                <h4>Recommended Preparation</h4>
                <ListItem items={report.difficulty?.recommendedPreparation} />
              </div>
            </div>
          </Section>

          {/* Professor Section */}
          <Section title="Professor Insights" icon="👨‍🏫">
            <div className="professor-rating">
              <h4>Average Professor Rating</h4>
              <StarRating rating={report.professors?.averageRating} size={20} />
            </div>
            
            <div className="professor-details">
              <div className="professor-card">
                <h4>Teaching Style</h4>
                <p>{report.professors?.teachingStyle}</p>
              </div>
              <div className="professor-card">
                <h4>Availability & Support</h4>
                <p>{report.professors?.availability}</p>
              </div>
            </div>
            
            <div className="professor-reviews">
              <h4>Common Student Feedback</h4>
              <ListItem items={report.professors?.commonReviews} />
            </div>
          </Section>

          {/* Statistics Section */}
          <Section title="Course Statistics" icon="📈">
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Enrollment Trend</h4>
                <p>{report.statistics?.enrollmentTrend}</p>
              </div>
              <div className="stat-card">
                <h4>Completion Rate</h4>
                <div className="completion-rate">
                  <span className="rate-value">{report.statistics?.completionRate}</span>
                </div>
              </div>
              <div className="stat-card">
                <h4>Popularity Score</h4>
                <div className="popularity-score">
                  <span className="score-value">{report.statistics?.popularityScore}/10</span>
                </div>
              </div>
            </div>
            
            <div className="grade-distribution-section">
              <h4>Average Grade Distribution</h4>
              <GradeDistributionChart distribution={report.statistics?.averageGradeDistribution} />
            </div>
          </Section>

          {/* Career Prospects Section */}
          <Section title="Career Prospects" icon="💼">
            <div className="career-header">
              <h4>Industry Relevance</h4>
              <CareerRelevanceMeter rating={report.careerProspects?.industryRelevance} />
            </div>
            
            <div className="career-grid">
              <div className="career-card">
                <h4>Skills Gained</h4>
                <ListItem items={report.careerProspects?.skillsGained} />
              </div>
              <div className="career-card">
                <h4>Career Paths</h4>
                <ListItem items={report.careerProspects?.careerPaths} />
              </div>
            </div>
            
            <div className="salary-impact">
              <h4>Salary Impact</h4>
              <p>{report.careerProspects?.salaryImpact}</p>
            </div>
          </Section>

          {/* Recommendations Section */}
          <Section title="Recommendations" icon="💡">
            <div className="recommendations-grid">
              <div className="recommendation-card">
                <h4>Best For</h4>
                <ListItem items={report.recommendations?.bestFor} />
              </div>
              <div className="recommendation-card">
                <h4>Study Tips</h4>
                <ListItem items={report.recommendations?.studyTips} />
              </div>
            </div>
            
            <div className="recommendation-details">
              <div className="detail-card">
                <h4>Time Management</h4>
                <p>{report.recommendations?.timeManagement}</p>
              </div>
              <div className="detail-card">
                <h4>Recommended Resources</h4>
                <ListItem items={report.recommendations?.resources} />
              </div>
            </div>
          </Section>

          {/* Additional Insights Section */}
          <Section title="Additional Insights" icon="🔍">
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Unique Aspects</h4>
                <ListItem items={report.additionalInsights?.uniqueAspects} />
              </div>
              <div className="insight-card">
                <h4>Common Mistakes</h4>
                <ListItem items={report.additionalInsights?.commonMistakes} />
              </div>
              <div className="insight-card">
                <h4>Success Factors</h4>
                <ListItem items={report.additionalInsights?.successFactors} />
              </div>
            </div>
          </Section>

          {/* Footer */}
          <div className="report-footer">
            <div className="generation-info">
              <p>
                Report generated on {new Date(report.metadata?.generatedAt).toLocaleDateString()}
                {report.cached && report.cacheAge && ` • Cached ${report.cacheAge} minutes ago`}
              </p>
              <p className="disclaimer">
                This report is generated using AI and should be used as a guide. 
                Always verify information with official university sources.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseReportModal;