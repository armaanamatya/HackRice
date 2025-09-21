require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const CatalogCourse = require('../models/CatalogCourse');

const seedCatalogCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing catalog courses...');
    await CatalogCourse.deleteMany({});
    console.log('Existing catalog courses cleared.');

    const uhCoursesPath = path.join(__dirname, '../../uh_comprehensive_courses.json');
    const riceCoursesPath = path.join(__dirname, '../../rice_comprehensive_courses.json');

    const loadCourses = async (filePath, university) => {
      console.log(`Loading courses from ${filePath} for ${university}...`);
      const rawData = fs.readFileSync(filePath, 'utf8');
      const courses = JSON.parse(rawData);
      console.log(`Successfully loaded ${courses.length} courses for ${university}.`);

      const catalogCourses = courses.map(course => ({
        code: course.code,
        title: course.title,
        description: course.description || 'No description available.',
        department: course.department || 'N/A',
        credit_hours: String(course.credit_hours) || 'N/A',
        prerequisites: course.prerequisites || 'None',
        university: university,
      }));

      console.log(`Inserting ${catalogCourses.length} courses for ${university} into the database...`);
      // Using insertMany with ordered: false to continue if some documents fail (e.g., duplicates)
      await CatalogCourse.insertMany(catalogCourses, { ordered: false })
        .then(docs => console.log(`Successfully inserted ${docs.length} courses for ${university}.`))
        .catch(err => {
          if (err.writeErrors) {
            console.warn(`Encountered ${err.writeErrors.length} write errors during insert for ${university} (e.g., duplicates). Continuing...`);
          } else {
            throw err; // Re-throw other errors
          }
        });
    };

    await loadCourses(uhCoursesPath, 'UH');
    await loadCourses(riceCoursesPath, 'Rice');

    console.log('Catalog course seeding complete.');
  } catch (error) {
    console.error('Error seeding catalog courses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedCatalogCourses();
