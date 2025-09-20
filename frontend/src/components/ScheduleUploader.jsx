import React, { useState } from 'react';
import ScheduleReviewForm from './ScheduleReviewForm'; // Import the review form

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

const ScheduleUploader = ({ onScheduleParsed, userId }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedClasses, setParsedClasses] = useState(null); // To store parsed data for review

  const uploadAndParseSchedule = async (uploadFile) => {
    setIsLoading(true);
    setUploadStatus('Uploading file...');
    
    // Create preview for image files
    if (uploadFile.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(uploadFile));
    }

    try {
      const formData = new FormData();
      formData.append('schedule', uploadFile);
      formData.append('userId', userId);

      const response = await fetch('/api/schedule/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setUploadStatus('Schedule processed successfully!');
      setIsLoading(false);

      console.log('=== PARSING RESULTS ===');
      console.log('Number of classes parsed:', data.courses.length);
      console.log('Parsed classes:', data.courses);
      
      if (data.courses.length === 0) {
        console.warn('⚠️ No classes were parsed from the file.');
        setUploadStatus('No classes found. Please try a different file.');
      } else {
        setParsedClasses(data.courses); // Store parsed classes for review
      }
    } catch (error) {
      console.error('Upload Error:', error);
      setUploadStatus(`Upload Failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setParsedClasses(null); // Reset parsed classes when new file is selected
      uploadAndParseSchedule(selectedFile);
    }
  };

  const handleScheduleValidated = async (validatedClasses) => {
    try {
      // Save courses to database
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          courses: validatedClasses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save courses');
      }

      onScheduleParsed(validatedClasses);
      setParsedClasses(null); // Clear review form after validation
      setFile(null); // Clear file after schedule is finalized
      setFilePreview(null);
    } catch (error) {
      console.error('Error saving courses:', error);
      setUploadStatus(`Failed to save courses: ${error.message}`);
    }
  };

  const handleBackToUpload = () => {
    setParsedClasses(null); // Exit review form
    setFile(null); // Clear the file as well
    setFilePreview(null);
    setUploadProgress(0);
    setUploadStatus('');
  };

  if (parsedClasses) {
    return (
      <ScheduleReviewForm
        initialClasses={parsedClasses}
        onScheduleValidated={handleScheduleValidated}
        onBackToUpload={handleBackToUpload}
      />
    );
  }

  return (
    <div className="schedule-uploader-container">
      <h2>Upload Your Schedule</h2>
      <p>Upload your class schedule in any format - image (PNG/JPEG), PDF, or calendar file (ICS/ICL)!</p>

      <div className="upload-area">
        <input
          type="file"
          id="scheduleFileUpload"
          accept="image/png, image/jpeg, image/jpg, .pdf, .ics, .icl"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isLoading}
        />
        <label htmlFor="scheduleFileUpload" className="upload-button" disabled={isLoading}>
          {file ? "Change Schedule File" : "Upload Schedule File"}
        </label>
        {isLoading && (
          <div className="ocr-status">
            <p>{uploadStatus}</p>
            {uploadProgress > 0 && uploadProgress < 1 && (
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${uploadProgress * 100}%` }}></div>
              </div>
            )}
          </div>
        )}
        {filePreview && !isLoading && (
          <div className="image-preview-container">
            <img src={filePreview} alt="Schedule Preview" className="schedule-preview" />
          </div>
        )}
        {file && !filePreview && !isLoading && (
          <div className="file-info">
            <p>File: {file.name}</p>
            <p>Type: {file.type || 'Unknown'}</p>
            <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
        {uploadStatus && !isLoading && uploadStatus.includes('Failed') && (
          <div className="error-message">
            <p>{uploadStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleUploader;
