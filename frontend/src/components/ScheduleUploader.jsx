import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { parseScheduleText } from '../utils/scheduleParser'; // Import the parser
import ScheduleReviewForm from './ScheduleReviewForm'; // Import the review form

/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

const ScheduleUploader = ({ onScheduleParsed }) => {
  const [image, setImage] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedClasses, setParsedClasses] = useState(null); // To store parsed data for review

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

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(imageFile);

    setOcrStatus('OCR Complete!');
    setIsLoading(false);
    await worker.terminate();

    const classes = parseScheduleText(text);
    setParsedClasses(classes); // Store parsed classes for review
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      // setImage(URL.createObjectURL(imgFile)); // Moved inside doOCR for better flow
      setParsedClasses(null); // Reset parsed classes when new image is selected
      doOCR(imgFile);
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
      <h2>Upload Your Schedule Image</h2>
      <p>Upload a PNG or JPG of your class schedule to get started!</p>

      <div className="upload-area">
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
        {image && !isLoading && (
          <div className="image-preview-container">
            <img src={image} alt="Schedule Preview" className="schedule-preview" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleUploader;
