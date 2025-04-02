// src/redux/slices/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import showService from "../../services/showService";
import userService from "../../services/userService";
import reviewService from "../../services/reviewService";

// Async thunks for customer functionalities

// Show related actions
export const getShowsByMovie = createAsyncThunk(
  "customer/getShowsByMovie",
  async (movieId, { rejectWithValue }) => {
    try {
      return await showService.getShowsByMovie(movieId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowsByMovieAndCity = createAsyncThunk(
  "customer/getShowsByMovieAndCity",
  async ({ movieId, city }, { rejectWithValue }) => {
    try {
      return await showService.getShowsByMovieAndCity(movieId, city);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowsByTheater = createAsyncThunk(
  "customer/getShowsByTheater",
  async (theaterId, { rejectWithValue }) => {
    try {
      return await showService.getShowsByTheater(theaterId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowsByDate = createAsyncThunk(
  "customer/getShowsByDate",
  async ({ date, city }, { rejectWithValue }) => {
    try {
      return await showService.getShowsByDate(date, city);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowSeatAvailability = createAsyncThunk(
  "customer/getShowSeatAvailability",
  async (showId, { rejectWithValue }) => {
    try {
      return await showService.getSeatAvailability(showId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

// User profile and preferences
export const updateUserProfile = createAsyncThunk(
  "customer/updateProfile",
  async ({ id, profileData }, { rejectWithValue }) => {
    try {
      return await userService.updateProfile(id, profileData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  "customer/updatePreferences",
  async ({ id, preferences }, { rejectWithValue }) => {
    try {
      return await userService.updatePreferences(id, preferences);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

// Review related actions
export const getMovieReviews = createAsyncThunk(
  "customer/getMovieReviews",
  async ({ movieId, status }, { rejectWithValue }) => {
    try {
      return await reviewService.getMovieReviews(movieId, status);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getUserReviews = createAsyncThunk(
  "customer/getUserReviews",
  async (userId, { rejectWithValue }) => {
    try {
      return await reviewService.getUserReviews(userId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const createReview = createAsyncThunk(
  "customer/createReview",
  async (reviewData, { rejectWithValue }) => {
    try {
      return await reviewService.createReview(reviewData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateReview = createAsyncThunk(
  "customer/updateReview",
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      return await reviewService.updateReview(id, reviewData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const deleteReview = createAsyncThunk(
  "customer/deleteReview",
  async (id, { rejectWithValue }) => {
    try {
      await reviewService.deleteReview(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const markHelpful = createAsyncThunk(
  "customer/markReviewHelpful",
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      return await reviewService.markHelpful(id, userId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const markUnhelpful = createAsyncThunk(
  "customer/markReviewUnhelpful",
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      return await reviewService.markUnhelpful(id, userId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const reportReview = createAsyncThunk(
  "customer/reportReview",
  async ({ id, reportData }, { rejectWithValue }) => {
    try {
      return await reviewService.reportReview(id, reportData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getReviewStats = createAsyncThunk(
  "customer/getReviewStats",
  async (movieId, { rejectWithValue }) => {
    try {
      return await reviewService.getReviewStats(movieId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const initialState = {
  shows: [],
  showsByMovie: [],
  showsByTheater: [],
  showsByDate: [],
  seatAvailability: null,
  movieReviews: [],
  userReviews: [],
  reviewStats: null,
  selectedShow: null,
  isLoading: false,
  error: null,
  success: false,
  message: ""
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    resetCustomerState: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearCustomerError: (state) => {
      state.error = null;
    },
    setSelectedShow: (state, action) => {
      state.selectedShow = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Shows By Movie
      .addCase(getShowsByMovie.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShowsByMovie.fulfilled, (state, action) => {
        state.isLoading = false;
        state.showsByMovie = action.payload;
      })
      .addCase(getShowsByMovie.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Shows By Movie And City
      .addCase(getShowsByMovieAndCity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShowsByMovieAndCity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.showsByMovie = action.payload;
      })
      .addCase(getShowsByMovieAndCity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Shows By Theater
      .addCase(getShowsByTheater.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShowsByTheater.fulfilled, (state, action) => {
        state.isLoading = false;
        state.showsByTheater = action.payload;
      })
      .addCase(getShowsByTheater.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Shows By Date
      .addCase(getShowsByDate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShowsByDate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.showsByDate = action.payload;
      })
      .addCase(getShowsByDate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Show Seat Availability
      .addCase(getShowSeatAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShowSeatAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.seatAvailability = action.payload;
      })
      .addCase(getShowSeatAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Profile updated successfully";
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update User Preferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Preferences updated successfully";
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Movie Reviews
      .addCase(getMovieReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMovieReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movieReviews = action.payload;
      })
      .addCase(getMovieReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get User Reviews
      .addCase(getUserReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userReviews = action.payload;
      })
      .addCase(getUserReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Review submitted successfully";
        
        // Add to movie reviews if it exists and is for the same movie
        if (state.movieReviews.length > 0 && 
            state.movieReviews[0].movieId === action.payload.movieId) {
          state.movieReviews.unshift(action.payload);
        }
        
        // Add to user reviews
        if (state.userReviews.length > 0) {
          state.userReviews.unshift(action.payload);
        }
      })
      .addCase(createReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Review
      .addCase(updateReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Review updated successfully";
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in user reviews if it exists
        state.userReviews = state.userReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Review
      .addCase(deleteReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Review deleted successfully";
        
        // Remove from movie reviews if it exists
        state.movieReviews = state.movieReviews.filter(review => review.id !== action.payload);
        
        // Remove from user reviews if it exists
        state.userReviews = state.userReviews.filter(review => review.id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark Review Helpful
      .addCase(markHelpful.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markHelpful.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
      })
      .addCase(markHelpful.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark Review Unhelpful
      .addCase(markUnhelpful.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markUnhelpful.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
      })
      .addCase(markUnhelpful.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Report Review
      .addCase(reportReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reportReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Review reported successfully";
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
      })
      .addCase(reportReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Review Stats
      .addCase(getReviewStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getReviewStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviewStats = action.payload;
      })
      .addCase(getReviewStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetCustomerState, clearCustomerError, setSelectedShow } = customerSlice.actions;
export default customerSlice.reducer;