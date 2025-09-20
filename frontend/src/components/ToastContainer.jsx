import React, { useState, useCallback } from 'react';
import Toast from './Toast';
import './Toast.css';

let toastId = 0;

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    const newToast = {
      id,
      message,
      type,
      duration,
      isVisible: true,
    };

    setToasts(prevToasts => [...prevToasts, newToast]);

    // Auto-remove toast after duration + animation time
    setTimeout(() => {
      removeToast(id);
    }, duration + 500);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Expose methods globally
  React.useEffect(() => {
    window.showToast = addToast;
    return () => {
      delete window.showToast;
    };
  }, [addToast]);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          isVisible={toast.isVisible}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Utility functions to show toasts from anywhere
export const showToast = (message, type = 'info', duration = 4000) => {
  if (window.showToast) {
    return window.showToast(message, type, duration);
  }
  console.warn('ToastContainer not mounted');
  return null;
};

export const showSuccessToast = (message, duration = 4000) => {
  return showToast(message, 'success', duration);
};

export const showErrorToast = (message, duration = 5000) => {
  return showToast(message, 'error', duration);
};

export const showWarningToast = (message, duration = 4000) => {
  return showToast(message, 'warning', duration);
};

export const showInfoToast = (message, duration = 4000) => {
  return showToast(message, 'info', duration);
};

export default ToastContainer;