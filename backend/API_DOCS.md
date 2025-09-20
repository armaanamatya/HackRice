# Courses API Documentation

## Updated MongoDB Structure

The courses are now stored in a `UserSchedule` collection with the following structure:

```javascript
{
  _id: ObjectId,
  user_id: ObjectId, // References User collection
  courses: [
    {
      id: String,          // Unique course identifier 
      courseCode: String,   // e.g., "CSC 101"
      courseName: String,   // Optional full course name
      days: [String],       // e.g., ["Mon", "Wed", "Fri"]
      startTime: String,    // e.g., "09:00"
      endTime: String,      // e.g., "09:50"
      location: String,     // Optional location
      semester: String,     // Optional semester
      year: Number,         // Optional year
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### GET /api/courses/exists/:userId
Check if a user has a schedule.

**Response:**
```json
{
  "hasSchedule": true,
  "scheduleId": "66f8a1b2c3d4e5f6789abc01"
}
```

### GET /api/courses/:userId
Get all courses for a user.

**Response:**
```json
{
  "courses": [
    {
      "id": "course-123",
      "courseCode": "CSC 101",
      "days": ["Mon", "Wed", "Fri"],
      "startTime": "09:00",
      "endTime": "09:50",
      "location": "Room 123"
    }
  ]
}
```

### POST /api/courses
Create or update a user's complete schedule.

**Request Body:**
```json
{
  "userId": "66f8a1b2c3d4e5f6789abc00",
  "courses": [
    {
      "id": "course-123",
      "courseCode": "CSC 101", 
      "days": ["Mon", "Wed", "Fri"],
      "startTime": "09:00",
      "endTime": "09:50",
      "location": "Room 123"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Courses saved successfully",
  "courses": [/* array of saved courses */]
}
```

### PATCH /api/courses/:userId/:courseId
Update a specific course in a user's schedule.

**Request Body:**
```json
{
  "location": "New Room 456",
  "startTime": "10:00"
}
```

**Response:**
```json
{
  "message": "Course updated successfully",
  "course": {/* updated course object */}
}
```

### DELETE /api/courses/:userId/:courseId
Delete a specific course from a user's schedule.

**Response:**
```json
{
  "message": "Course deleted successfully"
}
```

### DELETE /api/courses/:userId
Delete a user's entire schedule.

**Response:**
```json
{
  "message": "User schedule deleted successfully"
}
```

## Key Changes from Previous Structure

1. **Single Document Per User**: Each user now has one document in the `UserSchedule` collection instead of multiple documents in a `Course` collection.

2. **Embedded Courses Array**: All courses for a user are stored as an array within the user's schedule document.

3. **Better Performance**: Fewer database queries needed to fetch all courses for a user.

4. **Atomic Updates**: All course operations for a user are atomic since they're within a single document.

5. **Simplified Frontend Integration**: The API now returns exactly the structure expected by the frontend calendar component.

## Migration Considerations

If you have existing data in the old `Course` collection, you'll need to migrate it to the new structure. Here's a sample migration script:

```javascript
// Migration script (run in MongoDB shell or Node.js)
db.courses.aggregate([
  {
    $group: {
      _id: "$userId",
      courses: {
        $push: {
          id: { $toString: "$_id" },
          courseCode: "$courseCode",
          courseName: "$courseName", 
          days: "$days",
          startTime: "$startTime",
          endTime: "$endTime",
          location: "$location",
          semester: "$semester",
          year: "$year"
        }
      }
    }
  },
  {
    $project: {
      user_id: "$_id",
      courses: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      _id: 0
    }
  },
  {
    $out: "userschedules"
  }
]);
```