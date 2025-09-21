import React, { createContext, useContext } from 'react';

const UniversityContext = createContext();

export const useUniversity = () => {
  const context = useContext(UniversityContext);
  if (!context) {
    throw new Error('useUniversity must be used within a UniversityProvider');
  }
  return context;
};

export const UniversityProvider = ({ children, userData }) => {
  const userUniversity = userData?.university;
  
  return (
    <UniversityContext.Provider value={{ userUniversity }}>
      {children}
    </UniversityContext.Provider>
  );
};
