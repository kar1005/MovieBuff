// src/redux/slices/theaterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theaters: [],
  shows: [],
  currentTheater: null,
  screenLayout: null,
  loading: false,
  error: null,
};

const theaterSlice = createSlice({
  name: 'theater',
  initialState,
  reducers: {
    setTheaters: (state, action) => {
      state.theaters = action.payload;
    },
    setShows: (state, action) => {
      state.shows = action.payload;
    },
    setCurrentTheater: (state, action) => {
      state.currentTheater = action.payload;
    },
    setScreenLayout: (state, action) => {
      state.screenLayout = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addTheater: (state, action) => {
      state.theaters.push(action.payload);
    },
    updateTheater: (state, action) => {
      const index = state.theaters.findIndex(theater => theater.id === action.payload.id);
      if (index !== -1) {
        state.theaters[index] = action.payload;
      }
    },
    deleteTheater: (state, action) => {
      state.theaters = state.theaters.filter(theater => theater.id !== action.payload);
    },
    addShow: (state, action) => {
      state.shows.push(action.payload);
    },
    updateShow: (state, action) => {
      const index = state.shows.findIndex(show => show.id === action.payload.id);
      if (index !== -1) {
        state.shows[index] = action.payload;
      }
    },
    deleteShow: (state, action) => {
      state.shows = state.shows.filter(show => show.id !== action.payload);
    },
  },
});

// Export actions
export const {
  setTheaters,
  setShows,
  setCurrentTheater,
  setScreenLayout,
  setLoading,
  setError,
  addTheater,
  updateTheater,
  deleteTheater,
  addShow,
  updateShow,
  deleteShow,
} = theaterSlice.actions;

// Export reducer
export default theaterSlice.reducer;

// Selectors
export const selectTheaters = (state) => state.theater.theaters;
export const selectShows = (state) => state.theater.shows;
export const selectCurrentTheater = (state) => state.theater.currentTheater;
export const selectScreenLayout = (state) => state.theater.screenLayout;
export const selectLoading = (state) => state.theater.loading;
export const selectError = (state) => state.theater.error;