import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  movies: [],
  reviews: [],
  loading: false,
  error: null
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setMovies: (state, action) => {
      state.movies = action.payload;
    },
    setReviews: (state, action) => {
      state.reviews = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setMovies, setReviews, setLoading, setError } = adminSlice.actions;
export default adminSlice.reducer;