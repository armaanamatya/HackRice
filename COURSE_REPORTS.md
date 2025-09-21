# Course Report Generation System

This document explains the AI-powered course report generation feature that provides detailed analysis of courses using Google's Gemini API.

## Features

### Comprehensive Course Analysis
- **Course Overview**: Summary, learning objectives, and primary topics
- **Difficulty Analysis**: Rating (1-10 scale), workload estimation, challenge factors
- **Professor Insights**: Rate My Professor data aggregation and teaching style analysis
- **Statistical Data**: Enrollment trends, grade distributions, completion rates
- **Career Prospects**: Industry relevance, skills gained, career paths, salary impact
- **Recommendations**: Study tips, time management, resources, best practices
- **Additional Insights**: Unique aspects, common mistakes, success factors

### Smart Caching System
- **Memory Cache**: Fast in-memory storage for frequently accessed reports
- **File System Cache**: Persistent storage with automatic cleanup of stale reports
- **24-hour Cache Duration**: Fresh reports daily while maintaining performance
- **Cache Management API**: Manual cache clearing and status monitoring

### User Experience
- **One-Click Generation**: Generate reports from course modal with single button click
- **Loading States**: Professional loading animations during report generation
- **Error Handling**: Graceful error handling with informative messages
- **Responsive Design**: Mobile-optimized report display
- **Visual Data**: Interactive charts, progress bars, and rating displays

## Setup Instructions

### 1. Environment Configuration

Add your Gemini API key to the backend environment variables:

```bash
# In backend/.env
GEMINI_API_KEY=your_gemini_api_key_here
```

To get a Gemini API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your environment file

### 2. Dependencies

The system requires the following packages (already installed):

**Backend:**
```json
{
  "@google/generative-ai": "latest"
}
```

**Frontend:**
```javascript
// Uses built-in fetch API - no additional dependencies needed
```

### 3. File Structure

```
backend/
├── services/
│   └── geminiService.js          # Gemini AI integration
├── routes/
│   └── reports.js                # Report generation endpoints
└── data/
    └── reports/                  # Cached report storage

frontend/
├── src/
│   ├── components/
│   │   ├── CourseReportModal.jsx # Report display component  
│   │   ├── CourseReportModal.css # Report styling
│   │   └── ClassesPage.jsx       # Updated with report integration
│   └── types/
│       └── courseReport.js       # Type definitions and utilities
```

## API Endpoints

### Generate Full Report
```http
GET /api/reports/:courseCode?university=UniversityName
```

**Example:**
```bash
curl "http://localhost:3001/api/reports/COSC1436?university=University%20of%20Houston"
```

**Response:**
```json
{
  "metadata": {
    "courseCode": "COSC1436",
    "courseName": "Programming Fundamentals I",
    "university": "University of Houston",
    "department": "Computer Science",
    "generatedAt": "2024-01-15T10:30:00Z",
    "reportVersion": "1.0"
  },
  "overview": {
    "summary": "Introduction to programming concepts...",
    "learningObjectives": ["Learn basic programming", "..."],
    "primaryTopics": ["Variables", "Loops", "Functions", "..."]
  },
  // ... full report structure
}
```

### Generate Quick Summary
```http
GET /api/reports/:courseCode/quick?university=UniversityName
```

**Response:**
```json
{
  "difficulty": "6",
  "timeCommitment": "8-12 hours per week",
  "keySkills": ["Programming", "Problem Solving", "Debugging"],
  "careerRelevance": "9",
  "quickSummary": "Essential programming course for CS majors"
}
```

### Batch Report Generation
```http
POST /api/reports/batch
Content-Type: application/json

{
  "courseCodes": ["COSC1436", "MATH2414", "ENGL1303"],
  "university": "University of Houston"
}
```

### Cache Management
```http
GET /api/reports/cache/status           # View cache statistics
DELETE /api/reports/cache/:courseCode   # Clear specific course cache
```

## Usage in Frontend

### Basic Integration

```jsx
import { useState } from 'react';
import CourseReportModal from './CourseReportModal';

function CourseComponent({ course }) {
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    loading: false,
    error: null,
    report: null
  });

  const generateReport = async () => {
    setReportModal({ isOpen: true, loading: true, error: null, report: null });
    
    try {
      const response = await fetch(`/api/reports/${course.code}?university=${course.university}`);
      const report = await response.json();
      setReportModal({ isOpen: true, loading: false, error: null, report });
    } catch (error) {
      setReportModal({ isOpen: true, loading: false, error: error.message, report: null });
    }
  };

  return (
    <div>
      <button onClick={generateReport}>Generate AI Report</button>
      
      <CourseReportModal
        report={reportModal.report}
        isOpen={reportModal.isOpen}
        loading={reportModal.loading}
        error={reportModal.error}
        onClose={() => setReportModal({ isOpen: false, loading: false, error: null, report: null })}
      />
    </div>
  );
}
```

## Customization

### Report Format
Modify the structured format in `frontend/src/types/courseReport.js`:

```javascript
export const CourseReport = {
  metadata: { /* course info */ },
  overview: { /* course overview */ },
  difficulty: { /* difficulty analysis */ },
  // Add your custom sections here
  customSection: {
    customField: '',
    customArray: []
  }
};
```

### Gemini Prompts
Customize AI prompts in `backend/services/geminiService.js`:

```javascript
buildCourseResearchPrompt(course) {
  return `Your custom prompt here...
  
  Course: ${course.code} - ${course.title}
  
  Custom instructions...`;
}
```

### Styling
Customize report appearance in `frontend/src/components/CourseReportModal.css`:

```css
.report-modal {
  /* Your custom styles */
  --primary-color: #your-brand-color;
  --background: #your-background;
}
```

## Performance Considerations

### Caching Strategy
- Reports are cached for 24 hours by default
- Memory cache provides sub-second response times
- File system cache ensures persistence across server restarts
- Stale reports are automatically cleaned up

### Rate Limiting
- Implement rate limiting if needed for API costs
- Consider batching requests for multiple courses
- Use quick summaries for preview functionality

### Error Handling
- Network failures gracefully handled
- API key validation with clear error messages
- Fallback to cached data when possible
- User-friendly error displays

## Security Considerations

### API Key Protection
- Never expose Gemini API key in frontend code
- Use environment variables for configuration
- Implement proper server-side validation
- Consider request signing for production

### Input Validation
- Sanitize course codes and parameters
- Validate university names against known list
- Prevent injection attacks in prompts
- Rate limit API calls per user/IP

## Troubleshooting

### Common Issues

1. **"Failed to generate report"**
   - Check Gemini API key in environment
   - Verify internet connection
   - Check API quota limits

2. **"Course not found in catalog"**
   - Ensure course exists in your catalog data
   - Check course code spelling and formatting
   - Verify university name matches exactly

3. **Empty or incomplete reports**
   - Check Gemini API response format
   - Verify JSON parsing in service
   - Review prompt engineering

4. **Slow report generation**
   - Enable caching system
   - Use quick summaries for previews
   - Consider batch processing

### Debug Mode
Enable detailed logging:

```javascript
// In geminiService.js
console.log('Gemini request:', prompt);
console.log('Gemini response:', response);
```

### Cache Debugging
Monitor cache status:

```bash
curl http://localhost:3001/api/reports/cache/status
```

## Future Enhancements

### Planned Features
- [ ] Real-time Rate My Professor integration
- [ ] Historical grade data from registrar APIs
- [ ] Course prerequisite graph visualization
- [ ] Peer comparison with similar courses
- [ ] Personalized recommendations based on student profile
- [ ] Export reports to PDF/Word
- [ ] Integration with calendar systems
- [ ] Social sharing of anonymized reports

### Extension Points
- Custom report sections
- Alternative AI providers (OpenAI, Anthropic)
- Data source integrations
- Advanced caching strategies
- Multi-language support

## Support

For technical support or feature requests:
1. Check existing issues in the repository
2. Create detailed bug reports with steps to reproduce
3. Include relevant log files and error messages
4. Specify browser/OS versions for frontend issues

## Contributing

When contributing to the course report system:
1. Follow existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure responsive design for UI changes
5. Test with various course types and data

This feature significantly enhances the course discovery experience by providing AI-powered insights that help students make informed decisions about their academic journey.