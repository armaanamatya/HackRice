/**
 * Course Report Data Structure
 * Defines the standardized format for AI-generated course reports
 */

// Base course information
export const CourseReportMetadata = {
  courseCode: '',
  courseName: '',
  university: '',
  department: '',
  generatedAt: '',
  reportVersion: '1.0'
};

// Course overview section
export const CourseOverview = {
  summary: '',
  learningObjectives: [],
  primaryTopics: []
};

// Difficulty analysis section
export const CourseDifficulty = {
  difficultyRating: '', // 1-10 scale
  workloadHours: '', // Estimated weekly hours
  difficultyFactors: [],
  recommendedPreparation: []
};

// Professor ratings section
export const CourseProfessors = {
  averageRating: '', // Out of 5.0
  commonReviews: [],
  teachingStyle: '',
  availability: ''
};

// Statistical data section
export const CourseStatistics = {
  enrollmentTrend: '',
  averageGradeDistribution: {
    A: '',
    B: '',
    C: '',
    'D/F': ''
  },
  completionRate: '',
  popularityScore: '' // 1-10 scale
};

// Career prospects section
export const CareerProspects = {
  industryRelevance: '', // 1-10 scale
  skillsGained: [],
  careerPaths: [],
  salaryImpact: ''
};

// Recommendations section
export const CourseRecommendations = {
  bestFor: [],
  studyTips: [],
  timeManagement: '',
  resources: []
};

// Additional insights section
export const AdditionalInsights = {
  uniqueAspects: [],
  commonMistakes: [],
  successFactors: []
};

// Complete course report structure
export const CourseReport = {
  metadata: CourseReportMetadata,
  overview: CourseOverview,
  difficulty: CourseDifficulty,
  professors: CourseProfessors,
  statistics: CourseStatistics,
  careerProspects: CareerProspects,
  recommendations: CourseRecommendations,
  additionalInsights: AdditionalInsights
};

// Quick summary structure (lighter version)
export const QuickCourseSummary = {
  difficulty: '', // 1-10 scale
  timeCommitment: '', // Hours per week
  keySkills: [],
  careerRelevance: '', // 1-10 scale
  quickSummary: ''
};

// Report generation status
export const ReportStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  CACHED: 'cached'
};

// Utility functions for report validation
export const validateCourseReport = (report) => {
  const requiredSections = [
    'metadata', 'overview', 'difficulty', 'professors', 
    'statistics', 'careerProspects', 'recommendations', 'additionalInsights'
  ];
  
  for (const section of requiredSections) {
    if (!report[section]) {
      throw new Error(`Missing required section: ${section}`);
    }
  }
  
  return true;
};

export const getReportSectionNames = () => ({
  metadata: 'Course Information',
  overview: 'Course Overview',
  difficulty: 'Difficulty Analysis',
  professors: 'Professor Insights',
  statistics: 'Course Statistics',
  careerProspects: 'Career Prospects',
  recommendations: 'Recommendations',
  additionalInsights: 'Additional Insights'
});

export const getDifficultyColor = (rating) => {
  const numRating = parseInt(rating);
  if (numRating <= 3) return '#4ade80'; // Green - Easy
  if (numRating <= 6) return '#f59e0b'; // Yellow - Moderate  
  if (numRating <= 8) return '#f97316'; // Orange - Hard
  return '#ef4444'; // Red - Very Hard
};

export const getCareerRelevanceColor = (rating) => {
  const numRating = parseInt(rating);
  if (numRating <= 3) return '#ef4444'; // Red - Low relevance
  if (numRating <= 6) return '#f59e0b'; // Yellow - Medium relevance
  if (numRating <= 8) return '#10b981'; // Green - High relevance
  return '#8b5cf6'; // Purple - Extremely relevant
};

export const getRatingStars = (rating) => {
  const numRating = parseFloat(rating);
  const fullStars = Math.floor(numRating);
  const hasHalfStar = numRating % 1 >= 0.5;
  
  return {
    fullStars,
    hasHalfStar,
    emptyStars: 5 - fullStars - (hasHalfStar ? 1 : 0)
  };
};