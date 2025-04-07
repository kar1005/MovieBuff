// src/components/common/ContentWrapper/ContentWrapper.js
import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsLocationSet } from '../../../redux/slices/locationSlice';

const ContentWrapper = ({ children }) => {
  const isLocationSet = useSelector(selectIsLocationSet);
  
  // Only render children if location is set
  if (!isLocationSet) {
    // Return empty div when location is not set
    // The Header component will handle showing the location modal
    return <div className="min-vh-100"></div>;
  }
  
  // Otherwise, render the children normally
  return <>{children}</>;
};

export default ContentWrapper;