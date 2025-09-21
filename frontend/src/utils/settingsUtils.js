const SETTINGS_STORAGE_KEY = 'userSettings';

/**
 * Gets user settings from localStorage
 * @param {string} userId - The user ID to get settings for
 * @returns {Object} The user settings object
 */
export const getUserSettings = (userId) => {
  try {
    // For now, we'll use global settings regardless of userId
    // In the future, this could be user-specific: `${SETTINGS_STORAGE_KEY}_${userId}`
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const defaultSettings = {
      publicSchedule: false,
    };
    
    if (storedSettings) {
      return { ...defaultSettings, ...JSON.parse(storedSettings) };
    }
    
    return defaultSettings;
  } catch (error) {
    console.error('Error loading user settings:', error);
    return {
      publicSchedule: false,
    };
  }
};

/**
 * Checks if a user's schedule should be publicly visible
 * @param {string} userId - The user ID to check
 * @param {string} currentUserId - The current logged-in user's ID
 * @returns {boolean} True if the schedule should be visible
 */
export const isSchedulePubliclyVisible = (userId, currentUserId) => {
  // If viewing own profile, always show schedule
  if (userId === currentUserId) {
    return true;
  }
  
  // For other users, check their privacy settings
  // Note: Currently settings are stored globally per browser session
  // In a multi-user environment, this would need to be user-specific
  const userSettings = getUserSettings(userId);
  return userSettings.publicSchedule;
};
