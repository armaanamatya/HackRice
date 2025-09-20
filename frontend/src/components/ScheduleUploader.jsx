import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { parseScheduleText } from '../utils/scheduleParser'; // Import the parser
import { parseICSFile, isValidCalendarFile } from '../utils/icsParser'; // Import ICS parser
import ScheduleReviewForm from './ScheduleReviewForm'; // Import the review form
import './ScheduleUploader.css'; // Import styles

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

const ScheduleUploader = ({ onScheduleParsed }) => {
  const [image, setImage] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedClasses, setParsedClasses] = useState(null); // To store parsed data for review
  const [uploadType, setUploadType] = useState('image'); // 'image' or 'calendar'

  const worker = createWorker({
    logger: m => {
      if (m.status === 'recognizing text') {
        setOcrProgress(m.progress);
        setOcrStatus('Recognizing Text...');
      } else if (m.status === 'loading tesseract core') {
        setOcrStatus('Loading OCR Core...');
      } else if (m.status === 'initializing tesseract') {
        setOcrStatus('Initializing OCR...');
      } else if (m.status === 'loading language traineddata') {
        setOcrStatus(`Loading Language Data: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  const doOCR = async (imageFile) => {
    setIsLoading(true);
    setOcrStatus('Starting OCR...');
    setImage(URL.createObjectURL(imageFile)); // Set image preview immediately

    try {
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(imageFile);

      setOcrStatus('OCR Complete!');
      setIsLoading(false);
      await worker.terminate();

      const classes = parseScheduleText(text);
      setParsedClasses(classes); // Store parsed classes for review
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrStatus('OCR Failed. Please try again.');
      setIsLoading(false);
      await worker.terminate();
    }
  };

  const parseCalendarFile = async (calendarFile) => {
    setIsLoading(true);
    setOcrStatus('Parsing calendar file...');

    try {
      const classes = await parseICSFile(calendarFile);
      setOcrStatus('Calendar parsing complete!');
      setIsLoading(false);
      setParsedClasses(classes); // Store parsed classes for review
    } catch (error) {
      console.error('Calendar parsing error:', error);
      setOcrStatus(`Calendar parsing failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      setParsedClasses(null); // Reset parsed classes when new image is selected
      doOCR(imgFile);
    }
  };

  const handleCalendarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const calendarFile = e.target.files[0];
      
      if (!isValidCalendarFile(calendarFile)) {
        setOcrStatus('Please select a valid calendar file (.ics, .icl, .ical)');
        return;
      }

      setParsedClasses(null); // Reset parsed classes when new file is selected
      setImage(null); // Clear any previous image
      parseCalendarFile(calendarFile);
    }
  };

  const handleScheduleValidated = (validatedClasses) => {
    onScheduleParsed(validatedClasses);
    setParsedClasses(null); // Clear review form after validation
    setImage(null); // Clear image after schedule is finalized
  };

  const handleBackToUpload = () => {
    setParsedClasses(null); // Exit review form
    setImage(null); // Clear the image as well
    setOcrProgress(0);
    setOcrStatus('');
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
      <p>Upload a schedule image or calendar file to get started!</p>

      {/* Upload Type Selector */}
      <div className="upload-type-selector">
        <button 
          className={`upload-type-button ${uploadType === 'image' ? 'active' : ''}`}
          onClick={() => setUploadType('image')}
          disabled={isLoading}
        >
          📷 Image Upload
        </button>
        <button 
          className={`upload-type-button ${uploadType === 'calendar' ? 'active' : ''}`}
          onClick={() => setUploadType('calendar')}
          disabled={isLoading}
        >
          📅 Calendar File
        </button>
      </div>

      <div className="upload-area">
        {uploadType === 'image' ? (
          <>
            <input
              type="file"
              id="scheduleImageUpload"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
            <label htmlFor="scheduleImageUpload" className="upload-button" disabled={isLoading}>
              {image ? "Change Schedule Image" : "Upload Schedule Image"}
            </label>
            <p className="upload-help-text">
              Supported formats: PNG, JPG, JPEG
            </p>
          </>
        ) : (
          <>
            <input
              type="file"
              id="scheduleCalendarUpload"
              accept=".ics,.icl,.ical"
              onChange={handleCalendarChange}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
            <label htmlFor="scheduleCalendarUpload" className="upload-button" disabled={isLoading}>
              Upload Calendar File
            </label>
            <p className="upload-help-text">
              Supported formats: .ics, .icl, .ical
            </p>
          </>
        )}

        {isLoading && (
          <div className="ocr-status">
            <p>{ocrStatus}</p>
            {ocrProgress > 0 && ocrProgress < 1 && (
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${ocrProgress * 100}%` }}></div>
              </div>
            )}
          </div>
        )}

        {image && !isLoading && uploadType === 'image' && (
          <div className="image-preview-container">
            <img src={image} alt="Schedule Preview" className="schedule-preview" />
          </div>
        )}

        {ocrStatus && !isLoading && (
          <div className="status-message">
            <p>{ocrStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleUploader;
