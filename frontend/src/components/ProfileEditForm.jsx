import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileEditForm.css";

/**
 * ProfileEditForm component for editing user profile information.
 * @param {Object} props - The component props.
 * @param {Object} props.initialData - The initial user data to pre-populate the form.
 * @param {function} props.onProfileUpdated - Callback function after successful profile update.
 * @param {function} props.onCancel - Callback function to cancel editing.
 */
const ProfileEditForm = ({ initialData, onProfileUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    year: "",
    major: "",
    bio: "",
    email: "", // Add email to formData state
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        age: initialData.age || "",
        year: initialData.year || "",
        major: initialData.major || "",
        bio: initialData.bio || "",
        email: initialData.email || "", // Add email to formData state
      });
    }
  }, [initialData]);

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
      const response = await fetch(`/api/users/${initialData._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Profile updated successfully!");
        if (onProfileUpdated) {
          onProfileUpdated(data.user); // Pass the updated user data back
        }
      } else {
        console.error("Profile update failed:", data.message);
        alert(`Error updating profile: ${data.message}`);
      }
    } catch (error) {
      console.error("Error submitting profile update:", error);
      alert("An error occurred while updating your profile.");
    }
  };

  return (
    <div className="profile-edit-form-container">
      <h2>Edit Your Profile</h2>
      <form onSubmit={handleSubmit} className="profile-edit-form">
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
        <div className="form-actions">
          <button type="submit" className="submit-button">
            Save Changes
          </button>
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditForm;
