import json
import os

# Define departments and their course patterns
departments = {
    "ACCT": "Accounting",
    "AEC": "Arts & Entertainment Technologies",
    "AERO": "Aerospace Engineering",
    "AHST": "Art History",
    "ARAB": "Arabic Language",
    "ARCH": "Architecture",
    "ARTS": "Art Studio",
    "ASDN": "Asian Studies",
    "ATEC": "Arts, Technology & Emerging Communication",
    "BA": "Business Administration",
    "BCOM": "Business Communication",
    "BIOL": "Biology",
    "BLAW": "Business Law",
    "BMEN": "Biomedical Engineering",
    "CE": "Civil Engineering",
    "CHEM": "Chemistry",
    "CHIN": "Chinese",
    "COMD": "Communication Disorders",
    "COMM": "Communication",
    "CS": "Computer Science",
    "DANC": "Dance",
    "ECON": "Economics",
    "ECSC": "Environmental Science",
    "ECS": "Engineering & Computer Science",
    "EE": "Electrical Engineering",
    "EEGR": "Electrical Engineering Graduate",
    "EEMF": "Electrical Engineering Manufacturing",
    "EERF": "Electrical Engineering RF",
    "EMAC": "Emerging Media & Communication",
    "ENGL": "English",
    "ENGR": "Engineering",
    "EPCS": "Engineering Projects in Community Service",
    "EPPS": "Economic, Political & Policy Sciences",
    "FILM": "Film Studies",
    "FIN": "Finance",
    "FREN": "French",
    "GEOG": "Geography",
    "GEOS": "Geosciences",
    "GERM": "German",
    "GISC": "Geographic Information Systems",
    "GOVT": "Government",
    "HIST": "History",
    "HLTH": "Health",
    "HMGT": "Healthcare Management",
    "HONS": "Honors",
    "HUM": "Humanities",
    "IDEA": "Innovation & Entrepreneurship",
    "IMS": "International Management Studies",
    "IPEC": "International Political Economy",
    "ISAE": "Interdisciplinary Studies in Arts & Engineering",
    "ISGS": "Interdisciplinary Studies",
    "ITAL": "Italian",
    "JAPN": "Japanese",
    "KORE": "Korean",
    "LANG": "Language",
    "LATS": "Latin American Studies",
    "LIT": "Literature",
    "MATH": "Mathematics",
    "MECH": "Mechanical Engineering",
    "MILS": "Military Science",
    "MIS": "Management Information Systems",
    "MKT": "Marketing",
    "MSEN": "Materials Science & Engineering",
    "MTHE": "Mathematical Sciences",
    "MUSI": "Music",
    "NATS": "Natural Sciences",
    "NEUR": "Neuroscience",
    "NSCM": "Neuroscience",
    "OPRE": "Operations Research",
    "PA": "Public Affairs",
    "PHIL": "Philosophy",
    "PHIN": "Philosophy of Science",
    "PHYS": "Physics",
    "PSY": "Psychology",
    "PSYC": "Psychology",
    "RHET": "Rhetoric",
    "RISK": "Risk Management",
    "SCOM": "Speech Communication",
    "SE": "Software Engineering",
    "SOCS": "Social Sciences",
    "SOC": "Sociology",
    "SPAN": "Spanish",
    "SPAU": "Speech-Language Pathology & Audiology",
    "STAT": "Statistics",
    "SYSE": "Systems Engineering",
    "THEA": "Theatre",
    "UNIV": "University",
    "VISA": "Visual Arts",
    "WS": "Women's Studies"
}

# Course levels and their typical names/descriptions
course_levels = {
    1: {
        "name": "Introductory",
        "desc": "Introduction to fundamental concepts and principles"
    },
    2: {
        "name": "Foundation",
        "desc": "Development of core concepts and methodologies"
    },
    3: {
        "name": "Intermediate",
        "desc": "Advanced application of principles and theories"
    },
    4: {
        "name": "Advanced",
        "desc": "Specialized topics and in-depth analysis"
    }
}

def generate_course_title(dept_name, level, section):
    """Generate a meaningful course title."""
    level_info = course_levels[level]
    topics = {
        "Accounting": ["Financial", "Managerial", "Auditing", "Tax", "Systems"],
        "Computer Science": ["Programming", "Data Structures", "Algorithms", "Software", "Systems"],
        "Mathematics": ["Calculus", "Algebra", "Analysis", "Statistics", "Geometry"],
        "Physics": ["Mechanics", "Electromagnetism", "Quantum", "Thermodynamics", "Optics"],
        "Chemistry": ["Organic", "Inorganic", "Physical", "Analytical", "Biochemistry"],
        "Biology": ["Cellular", "Molecular", "Genetics", "Ecology", "Physiology"],
        "Engineering": ["Design", "Analysis", "Systems", "Control", "Materials"],
        "Economics": ["Micro", "Macro", "Econometrics", "Finance", "Policy"],
        "Psychology": ["Cognitive", "Social", "Clinical", "Developmental", "Research"],
        "History": ["American", "World", "European", "Asian", "Modern"]
    }
    
    default_topics = ["Theory", "Methods", "Applications", "Practice", "Research"]
    dept_topics = topics.get(dept_name, default_topics)
    topic = dept_topics[section % len(dept_topics)]
    
    return f"{level_info['name']} {topic} in {dept_name}"

def generate_course_description(dept_name, level, title):
    """Generate a meaningful course description."""
    level_info = course_levels[level]
    return f"{level_info['desc']} of {dept_name}. {title}. Students will learn theoretical foundations and practical applications in this field."

def generate_prerequisites(dept, code, level):
    """Generate realistic prerequisites based on course level."""
    if level == 1:
        return "None"
    elif level == 2:
        return f"{dept} 1{code[1:3]}0"
    elif level == 3:
        return f"{dept} 2{code[1:3]}0 or instructor consent"
    else:
        return f"{dept} 3{code[1:3]}0 and department approval"

def generate_courses():
    """Generate 500+ courses across all departments."""
    courses = []
    course_id = 1000

    for dept, name in departments.items():
        # Generate multiple courses for each department
        for level in range(1, 5):  # Levels 1-4
            for section in range(0, 3):  # Multiple courses per level
                course_id += 1
                code = f"{course_id}"[-3:]
                
                title = generate_course_title(name, level, section)
                description = generate_course_description(name, level, title)
                
                # Create course
                course = {
                    "code": f"{dept} {level}{code}",
                    "title": title,
                    "department": name,
                    "credit_hours": "3",
                    "description": description,
                    "prerequisites": generate_prerequisites(dept, code, level)
                }
                courses.append(course)

    return courses

# Ensure the directory exists
os.makedirs("backend/data/utd", exist_ok=True)

# Generate courses and write to file
courses = generate_courses()
with open('backend/data/utd/comprehensive_courses.json', 'w') as f:
    json.dump(courses, f, indent=2)

print(f"Generated {len(courses)} courses.")