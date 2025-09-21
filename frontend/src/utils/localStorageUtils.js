/**
 * @typedef {import('../utils/scheduleParser').ParsedClassData} ClassData
 */

const STORAGE_KEY_PREFIX = "scedulr_schedule_";

/**
 * Saves schedule data to localStorage.
 * @param {string} userId - The ID of the user (can be 'guest' if unauthenticated).
 * @param {ClassData[]} schedule - The array of class objects to save.
 */
export const saveScheduleToLocalStorage = (userId, schedule) => {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${userId}`,
      JSON.stringify(schedule)
    );
    console.log(`Schedule saved for user ${userId}`);
  } catch (error) {
    console.error("Error saving schedule to localStorage:", error);
  }
};

/**
 * Loads schedule data from localStorage.
 * @param {string} userId - The ID of the user (can be 'guest' if unauthenticated).
 * @returns {ClassData[] | null} The loaded array of class objects, or null if not found.
 */
export const loadScheduleFromLocalStorage = (userId) => {
  try {
    const storedSchedule = localStorage.getItem(
      `${STORAGE_KEY_PREFIX}${userId}`
    );
    return storedSchedule ? JSON.parse(storedSchedule) : null;
  } catch (error) {
    console.error("Error loading schedule from localStorage:", error);
    return null;
  }
};

/**
 * Clears schedule data from localStorage for a specific user.
 * @param {string} userId - The ID of the user.
 */
export const clearScheduleFromLocalStorage = (userId) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
    console.log(`Schedule cleared for user ${userId}`);
  } catch (error) {
    console.error("Error clearing schedule from localStorage:", error);
  }
};
