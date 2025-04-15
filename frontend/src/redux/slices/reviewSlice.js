// src/redux/slices/reviewSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import reviewService from "../../services/reviewService";
import movieService from "../../services/movieService";

// Async thunks for review operations
export const getAllReviews = createAsyncThunk(
  "reviews/getAll",
  async ({ movieId, status } = {}, { rejectWithValue }) => {
    try {
      return await reviewService.getAllReviews(movieId, status);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getReviewById = createAsyncThunk(
  "reviews/getById",
  async (id, { rejectWithValue }) => {
    try {
      return await reviewService.getReviewById(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getUserReviews = createAsyncThunk(
  "reviews/getUserReviews",
  async (userId, { rejectWithValue }) => {
    try {
      return await reviewService.getUserReviews(userId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getMovieReviews = createAsyncThunk(
  "reviews/getMovieReviews",
  async ({ movieId, status }, { rejectWithValue }) => {
    try {
      return await reviewService.getMovieReviews(movieId, status);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const createReview = createAsyncThunk(
  "reviews/create",
  async (reviewData, { dispatch, rejectWithValue }) => {
    try {
      const result = await reviewService.createReview(reviewData);
      
      // After creating the review, update the movie rating
      if (result && reviewData.status === 'APPROVED') {
        await recalculateAndUpdateMovieRating(reviewData.movieId, dispatch);
      }
      
      return result;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);


export const updateReview = createAsyncThunk(
  "reviews/update",
  async ({ id, reviewData }, { dispatch, rejectWithValue }) => {
    try {
      const result = await reviewService.updateReview(id, reviewData);
      
      // After updating the review, update the movie rating
      if (result && reviewData.movieId && reviewData.status === 'APPROVED') {
        await recalculateAndUpdateMovieRating(reviewData.movieId, dispatch);
      }
      
      return result;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async (id, { dispatch, getState, rejectWithValue }) => {
    try {
      // Get the review before deleting it to know which movie to update
      const reviewToDelete = await reviewService.getReviewById(id);
      const movieId = reviewToDelete?.movieId;
      
      await reviewService.deleteReview(id);
      
      // After deleting the review, update the movie rating
      if (movieId && reviewToDelete.status === 'APPROVED') {
        await recalculateAndUpdateMovieRating(movieId, dispatch);
      }
      
      return id;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);


export const moderateReview = createAsyncThunk(
  "reviews/moderate",
  async ({ id, moderationData }, { dispatch, rejectWithValue }) => {
    try {
      const result = await reviewService.moderateReview(id, moderationData);
      
      // After moderating the review, update the movie rating if status changed
      if (result && result.movieId) {
        await recalculateAndUpdateMovieRating(result.movieId, dispatch);
      }
      
      return result;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);
export const markHelpful = createAsyncThunk(
  "reviews/markHelpful",
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      return await reviewService.markHelpful(id, userId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const markUnhelpful = createAsyncThunk(
  "reviews/markUnhelpful",
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      return await reviewService.markUnhelpful(id, userId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const reportReview = createAsyncThunk(
  "reviews/report",
  async ({ id, reportData }, { rejectWithValue }) => {
    try {
      return await reviewService.reportReview(id, reportData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getReviewStats = createAsyncThunk(
  "reviews/getStats",
  async (movieId, { rejectWithValue }) => {
    try {
      return await reviewService.getReviewStats(movieId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateMovieRating = createAsyncThunk(
  "reviews/updateMovieRating",
  async ({ movieId, newAverage, newCount }, { rejectWithValue }) => {
    try {
      return await movieService.updateMovieRating(movieId, {
        average: newAverage,
        count: newCount
      });
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const recalculateAndUpdateMovieRating = async (movieId, dispatch, getState) => {
  try {
    // Get all approved reviews for this movie
    const response = await reviewService.getMovieReviews(movieId, 'APPROVED');
    const approvedReviews = response;
    
    // Calculate the new average rating
    let newAverage = 0;
    const newCount = approvedReviews.length;
    
    if (newCount > 0) {
      const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
      newAverage = parseFloat((sum / newCount).toFixed(1));
    }
    
    // Update the movie rating
    await dispatch(updateMovieRating({
      movieId,
      newAverage,
      newCount
    }));
    
  } catch (error) {
    console.error('Failed to update movie rating:', error);
  }
};

const initialState = {
  reviews: [],
  userReviews: [],
  movieReviews: [],
  selectedReview: null,
  reviewStats: null,
  isLoading: false,
  error: null,
  success: false,
  message: ""
};

const reviewSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    resetReviewState: (state) => {
      state.selectedReview = null;
      state.isLoading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearReviewError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get All Reviews
      .addCase(getAllReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload;
      })
      .addCase(getAllReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Review By ID
      .addCase(getReviewById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getReviewById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedReview = action.payload;
      })
      .addCase(getReviewById.rejected, (state, action) => {
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
      
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Review submitted successfully";
        
        // Add to all reviews list if it exists
        if (state.reviews.length > 0) {
          state.reviews.unshift(action.payload);
        }
        
        // Add to movie reviews if they match
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
        
        // Update in reviews list if it exists
        state.reviews = state.reviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in user reviews if it exists
        state.userReviews = state.userReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update selected review if it matches
        if (state.selectedReview && state.selectedReview.id === action.payload.id) {
          state.selectedReview = action.payload;
        }
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
        
        // Remove from reviews list
        state.reviews = state.reviews.filter(review => review.id !== action.payload);
        
        // Remove from movie reviews
        state.movieReviews = state.movieReviews.filter(review => review.id !== action.payload);
        
        // Remove from user reviews
        state.userReviews = state.userReviews.filter(review => review.id !== action.payload);
        
        // Clear selected review if it matches
        if (state.selectedReview && state.selectedReview.id === action.payload) {
          state.selectedReview = null;
        }
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Moderate Review
      .addCase(moderateReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(moderateReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Review moderated successfully";
        
        // Update in reviews list if it exists
        state.reviews = state.reviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in user reviews if it exists
        state.userReviews = state.userReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update selected review if it matches
        if (state.selectedReview && state.selectedReview.id === action.payload.id) {
          state.selectedReview = action.payload;
        }
      })
      .addCase(moderateReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark Helpful
      .addCase(markHelpful.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markHelpful.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update in reviews list if it exists
        state.reviews = state.reviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in user reviews if it exists
        state.userReviews = state.userReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update selected review if it matches
        if (state.selectedReview && state.selectedReview.id === action.payload.id) {
          state.selectedReview = action.payload;
        }
      })
      .addCase(markHelpful.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark Unhelpful
      .addCase(markUnhelpful.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markUnhelpful.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update in reviews list if it exists
        state.reviews = state.reviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in user reviews if it exists
        state.userReviews = state.userReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update selected review if it matches
        if (state.selectedReview && state.selectedReview.id === action.payload.id) {
          state.selectedReview = action.payload;
        }
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
        
        // Update in reviews list if it exists
        state.reviews = state.reviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in movie reviews if it exists
        state.movieReviews = state.movieReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update in user reviews if it exists
        state.userReviews = state.userReviews.map(review => 
          review.id === action.payload.id ? action.payload : review
        );
        
        // Update selected review if it matches
        if (state.selectedReview && state.selectedReview.id === action.payload.id) {
          state.selectedReview = action.payload;
        }
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

export const { resetReviewState, clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;