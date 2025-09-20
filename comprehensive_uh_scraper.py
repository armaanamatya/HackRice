#!/usr/bin/env python3
"""
Comprehensive UH Course Catalog Scraper
Creates extensive sample data for all UH majors and departments
"""

import time
import json
import csv
import os
import random

class ComprehensiveUHScraper:
    def __init__(self):
        self.courses = []
        
        # Comprehensive list of UH departments and majors
        self.departments = {
            # College of Engineering
            "Biomedical Engineering": ["BIOE"],
            "Chemical Engineering": ["CHEE"],
            "Civil Engineering": ["CIVE"],
            "Computer Engineering": ["EECE"],
            "Electrical Engineering": ["EECE"],
            "Industrial Engineering": ["INDE"],
            "Mechanical Engineering": ["MECE"],
            "Petroleum Engineering": ["PETE"],
            
            # College of Natural Sciences and Mathematics
            "Biology": ["BIOL"],
            "Biochemistry": ["BIOC"],
            "Chemistry": ["CHEM"],
            "Computer Science": ["COSC"],
            "Earth and Atmospheric Sciences": ["GEOS"],
            "Mathematics": ["MATH"],
            "Physics": ["PHYS"],
            "Statistics": ["STAT"],
            
            # College of Business
            "Accounting": ["ACCT"],
            "Business Administration": ["BUSA"],
            "Entrepreneurship": ["ENTR"],
            "Finance": ["FINA"],
            "Information Systems": ["ISDS"],
            "Management": ["MGMT"],
            "Marketing": ["MARK"],
            "Supply Chain Management": ["SCM"],
            
            # College of Liberal Arts and Social Sciences
            "Anthropology": ["ANTH"],
            "Art": ["ART"],
            "Communications": ["COMM"],
            "Economics": ["ECON"],
            "English": ["ENGL"],
            "History": ["HIST"],
            "Philosophy": ["PHIL"],
            "Political Science": ["POLS"],
            "Psychology": ["PSYC"],
            "Sociology": ["SOCI"],
            "Spanish": ["SPAN"],
            "Music": ["MUSI"],
            "Theatre": ["THEA"],
            
            # College of Education
            "Curriculum and Instruction": ["CUIN"],
            "Educational Psychology": ["EPSY"],
            "Health and Human Performance": ["HHPA"],
            
            # College of Architecture and Design
            "Architecture": ["ARCH"],
            "Industrial Design": ["IDES"],
            
            # College of Pharmacy
            "Pharmaceutical Sciences": ["PHAR"],
            "Pharmacology": ["PHAR"],
            
            # College of Optometry
            "Optometry": ["OPTO"],
            
            # College of Social Work
            "Social Work": ["SOCW"],
            
            # Conrad N. Hilton College of Hotel and Restaurant Management
            "Hotel and Restaurant Management": ["HRMA"],
            
            # College of Nursing
            "Nursing": ["NURS"],
            
            # College of Medicine
            "Medical Sciences": ["MEDS"],
            
            # College of Public Affairs
            "Public Affairs": ["PUAD"],
            
            # Additional Interdisciplinary Programs
            "Women's Studies": ["WOMS"],
            "African American Studies": ["AFAS"],
            "Mexican American Studies": ["MAST"],
            "Religious Studies": ["RELS"],
            "Environmental Science": ["ENVS"],
            "Interdisciplinary Studies": ["INST"],
        }
        
    def generate_course_levels(self):
        """Generate course numbers for different academic levels"""
        levels = {
            "freshman": range(1000, 2000),
            "sophomore": range(2000, 3000),
            "junior": range(3000, 4000),
            "senior": range(4000, 5000),
            "graduate": range(6000, 8000)
        }
        return levels
        
    def generate_course_titles(self, department):
        """Generate realistic course titles based on department"""
        course_types = {
            "intro": ["Introduction to", "Fundamentals of", "Principles of", "Basics of"],
            "intermediate": ["Intermediate", "Advanced", "Applied", "Modern"],
            "advanced": ["Advanced", "Senior", "Capstone", "Special Topics in"],
            "lab": ["Laboratory", "Practicum", "Workshop", "Studio"],
            "seminar": ["Seminar in", "Research in", "Topics in", "Studies in"]
        }
        
        subject_specific = {
            "Computer Science": ["Programming", "Data Structures", "Algorithms", "Software Engineering", "Database Systems", "Computer Networks", "Machine Learning", "Artificial Intelligence", "Cybersecurity", "Web Development"],
            "Mathematics": ["Calculus", "Linear Algebra", "Differential Equations", "Statistics", "Discrete Mathematics", "Abstract Algebra", "Real Analysis", "Number Theory", "Probability", "Geometry"],
            "Engineering": ["Design", "Systems", "Analysis", "Materials", "Thermodynamics", "Dynamics", "Controls", "Project Management", "Ethics", "Innovation"],
            "Biology": ["Cell Biology", "Genetics", "Ecology", "Evolution", "Microbiology", "Molecular Biology", "Physiology", "Biochemistry", "Biotechnology", "Bioinformatics"],
            "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry", "Biochemistry", "Materials Chemistry", "Environmental Chemistry", "Medicinal Chemistry"],
            "Business": ["Management", "Marketing", "Finance", "Operations", "Strategy", "Leadership", "Accounting", "Economics", "Entrepreneurship", "Analytics"],
            "Psychology": ["Cognitive Psychology", "Social Psychology", "Developmental Psychology", "Abnormal Psychology", "Research Methods", "Statistics", "Personality", "Learning"],
            "English": ["Literature", "Writing", "Rhetoric", "Composition", "American Literature", "British Literature", "World Literature", "Creative Writing", "Technical Writing"],
            "History": ["American History", "World History", "European History", "Ancient History", "Modern History", "Cultural History", "Political History", "Social History"]
        }
        
        # Find matching subject keywords
        subject_key = next((key for key in subject_specific.keys() if key.lower() in department.lower()), "General")
        if subject_key == "General":
            subjects = ["Theory", "Practice", "Analysis", "Research", "Methods", "Applications"]
        else:
            subjects = subject_specific[subject_key]
            
        return subjects
        
    def generate_comprehensive_courses(self):
        """Generate comprehensive course data for all departments"""
        print("Generating comprehensive UH course data...")
        
        all_courses = []
        levels = self.generate_course_levels()
        
        for department, prefixes in self.departments.items():
            print(f"Generating courses for {department}...")
            
            # Generate 8-15 courses per department
            num_courses = random.randint(8, 15)
            subjects = self.generate_course_titles(department)
            
            for i in range(num_courses):
                prefix = random.choice(prefixes)
                
                # Distribute courses across levels
                if i < 2:  # 2 freshman courses
                    level_range = levels["freshman"]
                elif i < 4:  # 2 sophomore courses
                    level_range = levels["sophomore"]
                elif i < 7:  # 3 junior courses
                    level_range = levels["junior"]
                elif i < 10:  # 3 senior courses
                    level_range = levels["senior"]
                else:  # graduate courses
                    level_range = levels["graduate"]
                
                course_num = random.choice(list(level_range))
                course_code = f"{prefix} {course_num}"
                
                # Generate course title
                subject = random.choice(subjects)
                if course_num < 2000:
                    title_prefix = random.choice(["Introduction to", "Fundamentals of", "Principles of"])
                elif course_num < 3000:
                    title_prefix = random.choice(["Intermediate", "Applied", ""])
                elif course_num < 4000:
                    title_prefix = random.choice(["Advanced", ""])
                else:
                    title_prefix = random.choice(["Advanced", "Senior", "Special Topics in"])
                
                title = f"{title_prefix} {subject}".strip()
                
                # Generate description
                descriptions = [
                    f"Comprehensive study of {subject.lower()} with emphasis on theoretical foundations and practical applications.",
                    f"Examination of key concepts and methodologies in {subject.lower()}. Includes hands-on experience and case studies.",
                    f"In-depth analysis of {subject.lower()} principles. Students will develop critical thinking and problem-solving skills.",
                    f"Advanced exploration of {subject.lower()} covering current research and industry practices.",
                    f"Fundamental concepts and applications of {subject.lower()}. Designed for students pursuing careers in related fields."
                ]
                description = random.choice(descriptions)
                
                # Generate credit hours (1-4, most commonly 3)
                credit_hours = str(random.choices([1, 2, 3, 4], weights=[5, 10, 70, 15])[0])
                
                # Generate prerequisites
                if course_num < 2000:
                    prerequisites = "None"
                elif course_num < 3000:
                    prereq_num = random.randint(1000, 1999)
                    prerequisites = f"{prefix} {prereq_num} or equivalent"
                elif course_num < 4000:
                    prereq_num = random.randint(2000, 2999)
                    prerequisites = f"{prefix} {prereq_num} and junior standing"
                else:
                    prereq_num = random.randint(3000, 3999)
                    prerequisites = f"{prefix} {prereq_num} and senior standing"
                
                course = {
                    "department": department,
                    "code": course_code,
                    "title": title,
                    "description": description,
                    "credit_hours": credit_hours,
                    "prerequisites": prerequisites
                }
                
                all_courses.append(course)
        
        self.courses = all_courses
        return all_courses
        
    def save_by_major(self, data_folder="data"):
        """Save scraped courses organized by major in separate files"""
        # Create data folder if it doesn't exist
        os.makedirs(data_folder, exist_ok=True)
        
        if not self.courses:
            print("No courses to save")
            return
        
        # Group courses by department/major
        courses_by_major = {}
        for course in self.courses:
            major = course.get('department', 'Unknown')
            # Clean major name for filename
            clean_major = "".join(c for c in major if c.isalnum() or c in (' ', '-', '_')).strip()
            clean_major = clean_major.replace(' ', '_').replace('&', 'and')
            
            if clean_major not in courses_by_major:
                courses_by_major[clean_major] = []
            courses_by_major[clean_major].append(course)
        
        # Save each major to separate files
        fieldnames = ['department', 'code', 'title', 'description', 'credit_hours', 'prerequisites']
        
        for major, courses in courses_by_major.items():
            # Save as JSON
            json_filename = os.path.join(data_folder, f"{major}_courses.json")
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(courses, f, indent=2, ensure_ascii=False)
            
            # Save as CSV
            csv_filename = os.path.join(data_folder, f"{major}_courses.csv")
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for course in courses:
                    row = {field: course.get(field, '') for field in fieldnames}
                    writer.writerow(row)
            
            print(f"Saved {len(courses)} courses for {major}")
        
        print(f"Created {len(courses_by_major)} major-specific files in {data_folder}/")
        return courses_by_major
    
    def save_master_files(self):
        """Save master JSON and CSV files with all courses"""
        # Save master JSON
        with open("uh_comprehensive_courses.json", 'w', encoding='utf-8') as f:
            json.dump(self.courses, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(self.courses)} courses to uh_comprehensive_courses.json")
        
        # Save master CSV
        if self.courses:
            fieldnames = ['department', 'code', 'title', 'description', 'credit_hours', 'prerequisites']
            
            with open("uh_comprehensive_courses.csv", 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for course in self.courses:
                    row = {field: course.get(field, '') for field in fieldnames}
                    writer.writerow(row)
            
            print(f"Saved {len(self.courses)} courses to uh_comprehensive_courses.csv")
    
    def generate_summary_report(self):
        """Generate a summary report of all departments and courses"""
        if not self.courses:
            return
            
        # Group by department
        dept_summary = {}
        for course in self.courses:
            dept = course['department']
            if dept not in dept_summary:
                dept_summary[dept] = []
            dept_summary[dept].append(course)
        
        # Generate report
        report = []
        report.append("UNIVERSITY OF HOUSTON - COMPREHENSIVE COURSE CATALOG SUMMARY")
        report.append("=" * 60)
        report.append(f"Total Courses: {len(self.courses)}")
        report.append(f"Total Departments: {len(dept_summary)}")
        report.append("")
        
        # Sort departments by number of courses
        sorted_depts = sorted(dept_summary.items(), key=lambda x: len(x[1]), reverse=True)
        
        report.append("DEPARTMENTS AND COURSE COUNTS:")
        report.append("-" * 40)
        for dept, courses in sorted_depts:
            report.append(f"{dept}: {len(courses)} courses")
        
        report.append("")
        report.append("SAMPLE COURSES BY DEPARTMENT:")
        report.append("-" * 40)
        
        for dept, courses in sorted_depts[:10]:  # Show first 10 departments
            report.append(f"\n{dept.upper()}:")
            for course in courses[:3]:  # Show first 3 courses
                report.append(f"  {course['code']}: {course['title']}")
        
        # Save report
        with open("uh_course_summary.txt", 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        
        print("Generated comprehensive summary report: uh_course_summary.txt")

def main():
    scraper = ComprehensiveUHScraper()
    
    try:
        # Generate comprehensive course data
        courses = scraper.generate_comprehensive_courses()
        print(f"Generated {len(courses)} total courses")
        
        # Save organized by major
        major_files = scraper.save_by_major()
        
        # Save master files
        scraper.save_master_files()
        
        # Generate summary report
        scraper.generate_summary_report()
        
        # Print final summary
        print(f"\n=== FINAL SUMMARY ===")
        print(f"Total courses generated: {len(courses)}")
        print(f"Departments covered: {len(major_files)}")
        print(f"Files created: {len(major_files) * 2} (JSON + CSV per department)")
        print(f"Data stored in: data/ folder")
        print(f"Master files: uh_comprehensive_courses.json/csv")
        print(f"Summary report: uh_course_summary.txt")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()