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

  // Create worker instance - we'll initialize it in the doOCR function

  const doOCR = async (imageFile) => {
    setIsLoading(true);
    setOcrStatus('Starting OCR...');
    setImage(URL.createObjectURL(imageFile)); // Set image preview immediately

    let worker = null;
    try {
      // Create and initialize worker
      worker = await createWorker('eng', 1, {
        logger: m => {
          console.log('Tesseract worker:', m);
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

      const { data: { text } } = await worker.recognize(imageFile);

      setOcrStatus('OCR Complete!');
      setIsLoading(false);

      console.log('=== OCR RESULTS ===');
      console.log('Raw OCR extracted text:', text);
      console.log('Text length:', text.length);
      console.log('Text lines:', text.split('\n'));
      
      const classes = parseScheduleText(text);
      console.log('=== PARSING RESULTS ===');
      console.log('Number of classes parsed:', classes.length);
      console.log('Parsed classes:', classes);
      
      if (classes.length === 0) {
        console.warn('⚠️ No classes were parsed from the OCR text. This might indicate:');
        console.warn('1. The text format doesn\'t match the expected pattern');
        console.warn('2. The OCR quality is poor');
        console.warn('3. The schedule format is different from expected');
      }
      
      setParsedClasses(classes); // Store parsed classes for review
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrStatus(`OCR Failed: ${error.message}`);
      setIsLoading(false);
    } finally {
      // Always try to terminate the worker
      if (worker) {
        try {
          await worker.terminate();
        } catch (terminateError) {
          console.error('Error terminating worker:', terminateError);
        }
      }
    }
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
        {ocrStatus && !isLoading && ocrStatus.includes('Failed') && (
          <div className="error-message">
            <p>{ocrStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleUploader;
