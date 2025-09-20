import React, { useState } from 'react';
import './UserProfileForm.css';

const UserProfileForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    year: '',
    major: '',
    bio: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('User Profile Data:', formData);
    alert('Profile Created Successfully!');
    // Call the onSubmit prop to hide the form after submission
    if (onSubmit) {
      onSubmit();
    }
    // In a real application, you would send this data to a backend API
  };

  return (
    <div className="user-profile-form-container">
      <h2>Create Your Profile</h2>
      <form onSubmit={handleSubmit} className="user-profile-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="year">Year</label>
          <select id="year" name="year" value={formData.year} onChange={handleChange} required>
            <option value="">Select Year</option>
            <option value="Freshman">Freshman</option>
            <option value="Sophomore">Sophomore</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="major">Major</label>
          <input
            type="text"
            id="major"
            name="major"
            value={formData.major}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="5"
            required
          ></textarea>
        </div>
        <button type="submit" className="submit-button">Create Profile</button>
      </form>
    </div>
  );
};

export default UserProfileForm;
