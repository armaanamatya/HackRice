// Utility functions to help debug and clear localStorage

// Clear all schedule-related data from localStorage
export const clearScheduleStorage = () => {
  const keys = Object.keys(localStorage);
  const scheduleKeys = keys.filter(key => 
    key.startsWith('schedule_') || 
    key.includes('course') || 
    key.includes('schedule')
  );
  
  console.log('Found schedule-related localStorage keys:', scheduleKeys);
  
  scheduleKeys.forEach(key => {
    console.log('Removing localStorage key:', key);
    localStorage.removeItem(key);
  });
  
  console.log('localStorage cleared!');
  return scheduleKeys.length;
};

// Clear all localStorage data
export const clearAllStorage = () => {
  console.log('Current localStorage keys:', Object.keys(localStorage));
  localStorage.clear();
  console.log('All localStorage cleared!');
};

// Inspect current localStorage data
export const inspectStorage = () => {
  const storage = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    storage[key] = localStorage.getItem(key);
  }
  console.log('Current localStorage:', storage);
  return storage;
};

// Global functions for browser console debugging
if (typeof window !== 'undefined') {
  window.clearScheduleStorage = clearScheduleStorage;
  window.clearAllStorage = clearAllStorage;
  window.inspectStorage = inspectStorage;
  
  console.log('Storage utilities loaded! Available functions:');
  console.log('- clearScheduleStorage() - Clear schedule data');
  console.log('- clearAllStorage() - Clear all localStorage');
  console.log('- inspectStorage() - View current localStorage');
}