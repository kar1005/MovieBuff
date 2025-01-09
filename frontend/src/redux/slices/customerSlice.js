import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bookings: [],
  selectedSeats: [],
  selectedShow: null,
  loading: false,
  error: null
};

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    setBookings: (state, action) => {
      state.bookings = action.payload;
    },
    setSelectedSeats: (state, action) => {
      state.selectedSeats = action.payload;
    },
    setSelectedShow: (state, action) => {
      state.selectedShow = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  setBookings,
  setSelectedSeats,
  setSelectedShow,
  setLoading,
  setError
} = customerSlice.actions;

export default customerSlice.reducer;