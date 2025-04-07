// src/redux/slices/locationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  city: localStorage.getItem('userCity') || null,
  coordinates: localStorage.getItem('userCoordinates') ? 
    JSON.parse(localStorage.getItem('userCoordinates')) : null,
  isLocationSet: !!localStorage.getItem('userCity')
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation: (state, action) => {
      state.city = action.payload.city;
      state.coordinates = action.payload.coordinates;
      state.isLocationSet = true;
      
      // Save to localStorage for persistence
      localStorage.setItem('userCity', action.payload.city);
      if (action.payload.coordinates) {
        localStorage.setItem('userCoordinates', JSON.stringify(action.payload.coordinates));
      }
    },
    clearLocation: (state) => {
      state.city = null;
      state.coordinates = null;
      state.isLocationSet = false;
      
      localStorage.removeItem('userCity');
      localStorage.removeItem('userCoordinates');
    }
  }
});

// Selectors
export const selectUserCity = (state) => state.location.city;
export const selectUserCoordinates = (state) => state.location.coordinates;
export const selectIsLocationSet = (state) => state.location.isLocationSet;

export const { setLocation, clearLocation } = locationSlice.actions;
export default locationSlice.reducer;