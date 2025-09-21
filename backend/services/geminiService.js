const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate a comprehensive course report using Gemini API
   * @param {Object} course - Course object from catalog
   * @returns {Promise<Object>} Structured course report
   */
  async generateCourseReport(course) {
    try {
      const prompt = this.buildCourseResearchPrompt(course);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Raw Gemini response:', text.substring(0, 500) + '...');
      
      // Clean and extract JSON from the response
      let reportData;
      try {
        // Try to parse directly first
        reportData = JSON.parse(text);
      } catch (parseError) {
        console.log('Direct JSON parse failed, attempting to extract JSON...');
        
        // Extract JSON from markdown code blocks or other formatting
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                         text.match(/{[\s\S]*}/);
        
        if (jsonMatch) {
          const jsonText = jsonMatch[1] || jsonMatch[0];
          console.log('Extracted JSON:', jsonText.substring(0, 200) + '...');
          
          try {
            reportData = JSON.parse(jsonText);
          } catch (extractedParseError) {
            console.error('Failed to parse extracted JSON:', extractedParseError);
            throw new Error('AI response is not in valid JSON format');
          }
        } else {
          console.error('No JSON found in response:', text);
          throw new Error('AI response does not contain valid JSON');
        }
      }
      
      // Validate that we have the expected structure
      if (!reportData || typeof reportData !== 'object') {
        throw new Error('Invalid report data structure');
      }
      
      // Add metadata
      reportData.metadata = {
        courseCode: course.code,
        courseName: course.title,
        university: course.university,
        department: course.department,
        generatedAt: new Date().toISOString(),
        reportVersion: '1.0'
      };
      
      console.log('Successfully generated report for:', course.code);
      return reportData;
      
    } catch (error) {
      console.error('Error generating course report:', error);
      console.error('Course details:', { code: course.code, title: course.title });
      
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        throw new Error('AI response format error. Please try again.');
      }
      
      // Fallback: create basic report structure if AI fails
      console.log('Falling back to basic report structure...');
      return this.generateFallbackReport(course);
    }
  }

  /**
   * Generate a basic fallback report when AI fails
   * @param {Object} course - Course object
   * @returns {Object} Basic report structure
   */
  generateFallbackReport(course) {
    return {
      metadata: {
        courseCode: course.code,
        courseName: course.title,
        university: course.university,
        department: course.department,
        generatedAt: new Date().toISOString(),
        reportVersion: '1.0-fallback'
      },
      overview: {
        summary: `${course.title} is a ${course.credit_hours || 3}-credit course in the ${course.department} department at ${course.university}.`,
        learningObjectives: [
          "Understand core concepts covered in the course",
          "Apply knowledge through assignments and projects",
          "Develop analytical and critical thinking skills",
          "Prepare for advanced coursework in the field"
        ],
        primaryTopics: [
          "Fundamental concepts",
          "Theoretical foundations",
          "Practical applications",
          "Problem-solving techniques"
        ]
      },
      difficulty: {
        difficultyRating: this.estimateCourseDifficulty(course),
        workloadHours: this.estimateWorkload(course),
        difficultyFactors: [
          "Course content complexity",
          "Assignment requirements",
          "Prerequisites needed"
        ],
        recommendedPreparation: course.prerequisites && course.prerequisites !== 'None' ? 
          [`Complete prerequisites: ${course.prerequisites}`] : 
          ["Strong foundation in basic concepts", "Time management skills"]
      },
      professors: {
        averageRating: "3.5",
        commonReviews: [
          "Professor expertise varies",
          "Course structure depends on instructor",
          "Office hours available for help"
        ],
        teachingStyle: "Teaching approaches vary by instructor",
        availability: "Office hours typically available weekly"
      },
      statistics: {
        enrollmentTrend: "Stable enrollment with consistent demand",
        averageGradeDistribution: {
          A: "25",
          B: "35",
          C: "25",
          "D/F": "15"
        },
        completionRate: "85%",
        popularityScore: "6"
      },
      careerProspects: {
        industryRelevance: this.estimateIndustryRelevance(course),
        skillsGained: [
          "Analytical thinking",
          "Problem-solving",
          "Subject-specific knowledge",
          "Communication skills"
        ],
        careerPaths: [
          "Advanced study in the field",
          "Related industry positions",
          "Graduate school preparation"
        ],
        salaryImpact: "Contributes to overall educational foundation and career preparation"
      },
      recommendations: {
        bestFor: [
          `Students majoring in ${course.department}`,
          "Those interested in the subject area",
          "Students meeting prerequisites"
        ],
        studyTips: [
          "Attend all lectures and take detailed notes",
          "Start assignments early",
          "Form study groups with classmates",
          "Utilize professor office hours"
        ],
        timeManagement: "Plan for regular study sessions and stay organized with assignments",
        resources: [
          "Course textbook and materials",
          "University library resources",
          "Online academic databases",
          "Study groups and tutoring services"
        ]
      },
      additionalInsights: {
        uniqueAspects: [
          `Part of ${course.department} curriculum`,
          "Builds foundation for advanced courses"
        ],
        commonMistakes: [
          "Procrastinating on assignments",
          "Not attending lectures regularly",
          "Ignoring prerequisite knowledge gaps"
        ],
        successFactors: [
          "Consistent attendance and participation",
          "Completing all assignments on time",
          "Seeking help when needed"
        ]
      }
    };
  }

  /**
   * Estimate course difficulty based on course code and level
   */
  estimateCourseDifficulty(course) {
    const courseNumber = course.code?.match(/\d+/)?.[0];
    if (!courseNumber) return "5";
    
    const num = parseInt(courseNumber);
    if (num >= 7000) return "9"; // Doctoral
    if (num >= 5000) return "8"; // Graduate
    if (num >= 4000) return "7"; // Senior
    if (num >= 3000) return "6"; // Junior
    if (num >= 2000) return "4"; // Sophomore
    if (num >= 1000) return "3"; // Freshman
    return "5"; // Default
  }

  /**
   * Estimate weekly workload
   */
  estimateWorkload(course) {
    const credits = parseInt(course.credit_hours) || 3;
    const baseHours = credits * 2; // Rule of thumb: 2 hours study per credit hour
    return `${baseHours}-${baseHours + 3} hours per week`;
  }

  /**
   * Estimate industry relevance
   */
  estimateIndustryRelevance(course) {
    const dept = course.department?.toLowerCase() || '';
    if (dept.includes('computer') || dept.includes('engineering')) return "8";
    if (dept.includes('business') || dept.includes('economics')) return "7";
    if (dept.includes('math') || dept.includes('science')) return "6";
    return "5"; // Default
  }

  /**
   * Build the research prompt for Gemini
   * @param {Object} course - Course object
   * @returns {string} Research prompt
   */
  buildCourseResearchPrompt(course) {
    return `You are an academic research assistant tasked with creating a comprehensive course analysis report. 

Course Information:
- Code: ${course.code}
- Title: ${course.title}
- University: ${course.university}
- Department: ${course.department}
- Credit Hours: ${course.credit_hours}
- Description: ${course.description}
- Prerequisites: ${course.prerequisites || 'None'}

Please research and analyze this course thoroughly, including:
1. Course content and learning objectives
2. Difficulty level and workload expectations
3. Career prospects and industry relevance
4. Student success rates and grade distributions (if available)
5. Professor ratings and teaching quality (search for Rate My Professor data if possible)
6. Course popularity and enrollment trends
7. Skills and competencies gained
8. Recommended preparation and study strategies

IMPORTANT: You must respond with ONLY valid JSON. No explanations, no markdown formatting, no code blocks, no additional text. Just pure JSON.

Provide your analysis in the following exact JSON structure:

{
  "overview": {
    "summary": "Brief 2-3 sentence overview of the course",
    "learningObjectives": ["List of 4-6 key learning objectives"],
    "primaryTopics": ["List of 5-8 main topics covered"]
  },
  "difficulty": {
    "difficultyRating": "Scale of 1-10 (10 being most difficult)",
    "workloadHours": "Estimated weekly hours of work",
    "difficultyFactors": ["List of factors that make this course challenging"],
    "recommendedPreparation": ["List of recommended skills or courses"]
  },
  "professors": {
    "averageRating": "Average rating out of 5.0 (estimate if Rate My Professor data not available)",
    "commonReviews": ["List of common positive/negative feedback themes"],
    "teachingStyle": "Description of typical teaching approaches for this subject",
    "availability": "Information about office hours and professor accessibility"
  },
  "statistics": {
    "enrollmentTrend": "Increasing/Stable/Decreasing with brief explanation",
    "averageGradeDistribution": {
      "A": "percentage",
      "B": "percentage", 
      "C": "percentage",
      "D/F": "percentage"
    },
    "completionRate": "Estimated percentage of students who successfully complete",
    "popularityScore": "Scale of 1-10 based on demand and enrollment"
  },
  "careerProspects": {
    "industryRelevance": "Scale of 1-10 for current job market relevance",
    "skillsGained": ["List of technical and soft skills acquired"],
    "careerPaths": ["List of career paths this course supports"],
    "salaryImpact": "Brief description of potential salary impact"
  },
  "recommendations": {
    "bestFor": ["Types of students who would benefit most"],
    "studyTips": ["Specific study strategies for success"],
    "timeManagement": "Advice for managing workload",
    "resources": ["Recommended textbooks, websites, or tools"]
  },
  "additionalInsights": {
    "uniqueAspects": ["What makes this course special or unique"],
    "commonMistakes": ["Mistakes students often make"],
    "successFactors": ["Key factors for success in this course"]
  }
}

CRITICAL REQUIREMENTS:
- Respond with ONLY the JSON object - no explanations or additional text
- All string values must be properly quoted
- All arrays must contain properly quoted string elements
- Numbers should be strings (e.g. "7" not 7)
- No trailing commas
- No comments in JSON
- Provide realistic estimates based on course level
- Make analysis specific to the university when possible
- Focus on actionable student insights`;
  }

  /**
   * Generate a quick course summary (lighter version)
   * @param {Object} course - Course object from catalog
   * @returns {Promise<Object>} Quick summary
   */
  async generateQuickSummary(course) {
    try {
      const prompt = `Provide a concise analysis of this course in JSON format:

Course: ${course.code} - ${course.title}
University: ${course.university}
Department: ${course.department}
Description: ${course.description}

Return JSON with this structure:
{
  "difficulty": "1-10 scale",
  "timeCommitment": "hours per week estimate", 
  "keySkills": ["3-4 main skills gained"],
  "careerRelevance": "1-10 scale for job market value",
  "quickSummary": "One sentence describing the course essence"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating quick summary:', error);
      throw new Error('Failed to generate quick summary');
    }
  }
}

module.exports = new GeminiService();