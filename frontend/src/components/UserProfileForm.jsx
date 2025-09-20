import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfileForm.css";

const UserProfileForm = ({ onSubmit, initialData }) => {
  const navigate = useNavigate(); // Initialize useNavigate

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    age: initialData?.age || "",
    year: initialData?.year || "",
    major: initialData?.major || "",
    bio: initialData?.bio || "",
    email: initialData?.email || "", // Add email to formData state
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `/api/users/complete-profile/${initialData._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Profile Created Successfully!");
        if (onSubmit) {
          // Pass the updated user data (including profileCompleted: true) back to App.jsx
          onSubmit(data.user);
        }
      } else {
        console.error("Profile update failed:", data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert("An error occurred while creating your profile.");
    }
  };

  const isEditMode = initialData?.name;

  return (
    <div className="user-profile-form-container">
      <h2>{isEditMode ? "Edit Your Profile" : "Create Your Profile"}</h2>
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
          <select
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
          >
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
        <button type="submit" className="submit-button">
          {isEditMode ? "Update Profile" : "Create Profile"}
        </button>
      </form>
    </div>
  );
};

export default UserProfileForm;
