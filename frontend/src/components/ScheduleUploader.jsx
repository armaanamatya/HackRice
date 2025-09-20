import React, { useState } from "react";
import ScheduleReviewForm from "./ScheduleReviewForm"; // Import the review form
import { showSuccessToast, showErrorToast, showWarningToast } from "./ToastContainer";
import "./ScheduleUploader.css";

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

// A simple SVG icon for better visuals without extra dependencies
const UploadIcon = () => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="upload-icon"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const ScheduleUploader = ({ onScheduleParsed, userId }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedClasses, setParsedClasses] = useState(null); // To store parsed data for review

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check for accepted file types
    const acceptedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
      "text/calendar",
    ];
    if (!acceptedTypes.some((type) => selectedFile.type.startsWith(type))) {
      const errorMessage = `Unsupported file type (${selectedFile.type}). Please upload an image, PDF, or ICS file.`;
      setUploadStatus(`Error: ${errorMessage}`);
      showErrorToast(errorMessage);
      return;
    }

    setFile(selectedFile);
    setParsedClasses(null);
    setUploadStatus("");

    if (selectedFile.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(selectedFile));
    } else {
      setFilePreview(null); // No preview for non-image files
    }

    uploadAndParseSchedule(selectedFile);
  };

  const uploadAndParseSchedule = async (uploadFile) => {
    setIsLoading(true);
    setUploadStatus("Processing your schedule...");

    try {
      const formData = new FormData();
      formData.append("schedule", uploadFile);
      formData.append("userId", userId);

      const response = await fetch("/api/schedule/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(`Upload failed: ${errorData.message}`);
      }

      const data = await response.json();

      setUploadStatus("Schedule processed successfully!");
      setIsLoading(false);

      if (data.courses.length === 0) {
        const warningMessage = "No classes found. Please try a different file or check the image quality.";
        setUploadStatus(warningMessage);
        showWarningToast(warningMessage);
      } else {
        showSuccessToast(`Successfully processed your schedule! Found ${data.courses.length} classes.`);
        setParsedClasses(data.courses);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      const errorMessage = `Upload Failed: ${error.message}`;
      setUploadStatus(errorMessage);
      showErrorToast(errorMessage);
      setIsLoading(false);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow drop
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files && e.target.files[0];
    processFile(selectedFile);
  };

  const handleScheduleValidated = async (validatedClasses) => {
    // ... (Your existing logic is perfect here)
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courses: validatedClasses }),
      });
      if (!response.ok) throw new Error("Failed to save courses");
      showSuccessToast("Schedule saved successfully to your dashboard!");
      onScheduleParsed(validatedClasses);
      handleReset();
    } catch (error) {
      console.error("Error saving courses:", error);
      const errorMessage = `Failed to save courses: ${error.message}`;
      setUploadStatus(errorMessage);
      showErrorToast(errorMessage);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview(null);
    setParsedClasses(null);
    setUploadStatus("");
    setIsLoading(false);
  };

  // If we have parsed classes, show the review form
  if (parsedClasses) {
    return (
      <ScheduleReviewForm
        initialClasses={parsedClasses}
        onScheduleValidated={handleScheduleValidated}
        onBackToUpload={handleReset}
      />
    );
  }

  // --- Uploader UI Rendering ---
  const dropZoneClassName = `drop-zone ${isDragging ? "is-dragging" : ""} ${
    file ? "has-file" : ""
  }`;

  return (
    <div className="schedule-uploader-container">
      <div className="uploader-header">
        <h2>Upload Your Schedule</h2>
        <p>
          Drop your schedule image (PNG, JPG), PDF, or calendar file (ICS)
          below.
        </p>
      </div>

      <div
        className={dropZoneClassName}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="scheduleFileUpload"
          accept="image/png, image/jpeg, image/jpg, .pdf, .ics, .icl"
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="status-indicator">
            <div className="loading-spinner"></div>
            <p>{uploadStatus}</p>
          </div>
        ) : file ? (
          <div className="file-preview-wrapper">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Schedule Preview"
                className="schedule-preview"
              />
            ) : (
              <div className="file-info-icon">
                <span>📄</span>
                <p>{file.name}</p>
              </div>
            )}
            <button
              onClick={handleReset}
              className="remove-file-button"
              aria-label="Remove file"
            >
              &times;
            </button>
          </div>
        ) : (
          <label htmlFor="scheduleFileUpload" className="drop-zone-prompt">
            <UploadIcon />
            <p>
              <strong>Drag & drop a file here</strong>
            </p>
            <p className="browse-text">or click to browse</p>
          </label>
        )}
      </div>

      {uploadStatus && !isLoading && !parsedClasses && (
        <div
          className={`upload-status-message ${
            uploadStatus.includes("Failed") || uploadStatus.includes("Error")
              ? "error"
              : ""
          }`}
        >
          <p>{uploadStatus}</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleUploader;
