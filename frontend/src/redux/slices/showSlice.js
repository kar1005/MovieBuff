// src/redux/slices/showSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import showService from "../../services/showService";

// Async thunks for show operations
export const createShow = createAsyncThunk(
  "shows/create",
  async (showData, { rejectWithValue }) => {
    try {
      return await showService.createShow(showData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateShow = createAsyncThunk(
  "shows/update",
  async ({ id, showData }, { rejectWithValue }) => {
    try {
      return await showService.updateShow(id, showData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const deleteShow = createAsyncThunk(
  "shows/delete",
  async (id, { rejectWithValue }) => {
    try {
      await showService.deleteShow(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowById = createAsyncThunk(
  "shows/getById",
  async (id, { rejectWithValue }) => {
    try {
      return await showService.getShow(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowsByTheater = createAsyncThunk(
  "shows/getByTheater",
  async (theaterId, { rejectWithValue }) => {
    try {
      return await showService.getShowsByTheater(theaterId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowsByMovie = createAsyncThunk(
  "shows/getByMovie",
  async (movieId, { rejectWithValue }) => {
    try {
      return await showService.getShowsByMovie(movieId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowsByTheaterAndScreen = createAsyncThunk(
  "shows/getByTheaterAndScreen",
  async ({ theaterId, screenNumber, startTime, endTime }, { rejectWithValue }) => {
    try {
      return await showService.getShowsByTheaterAndScreen(theaterId, screenNumber, startTime, endTime);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowsByDate = createAsyncThunk(
  "shows/getByDate",
  async ({ date, city }, { rejectWithValue }) => {
    try {
      return await showService.getShowsByDate(date, city);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowsByMovieAndCity = createAsyncThunk(
  "shows/getByMovieAndCity",
  async ({ movieId, city }, { rejectWithValue }) => {
    try {
      return await showService.getShowsByMovieAndCity(movieId, city);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateShowStatus = createAsyncThunk(
  "shows/updateStatus",
  async ({ showId, status }, { rejectWithValue }) => {
    try {
      await showService.updateShowStatus(showId, status);
      return { id: showId, status };
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateSeatAvailability = createAsyncThunk(
  "shows/updateSeatAvailability",
  async ({ showId, seatIds, available }, { rejectWithValue }) => {
    try {
      await showService.updateSeatAvailability(showId, seatIds, available);
      return { showId, seatIds, available };
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getSeatAvailability = createAsyncThunk(
  "shows/getSeatAvailability",
  async (showId, { rejectWithValue }) => {
    try {
      return await showService.getSeatAvailability(showId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getShowAnalytics = createAsyncThunk(
  "shows/getAnalytics",
  async ({ startDate, endDate, movieId, theaterId }, { rejectWithValue }) => {
    try {
      return await showService.getShowAnalytics(startDate, endDate, movieId, theaterId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getTrendingShows = createAsyncThunk(
  "shows/getTrending",
  async ({ city, limit }, { rejectWithValue }) => {
    try {
      return await showService.getTrendingShows(city, limit);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const initialState = {
  shows: [],
  showsByTheater: [],
  showsByMovie: [],
  showsByScreen: [],
  showsByDate: [],
  showDetail: null,
  seatAvailability: null,
  analytics: null,
  trendingShows: [],
  isLoading: false,
  error: null,
  success: false,
  message: ""
};

const showSlice = createSlice({
  name: "shows",
  initialState,
  reducers: {
    resetShowState: (state) => {
      state.showDetail = null;
      state.isLoading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearShowError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Show
      .addCase(createShow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createShow.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Show created successfully";
        
        // Add to shows list if it exists
        if (state.shows.length > 0) {
          state.shows.push(action.payload);
        }
        
        // Add to shows by theater list if it exists and matches
        if (state.showsByTheater.length > 0 && 
            state.showsByTheater[0]?.theaterId === action.payload.theaterId) {
          state.showsByTheater.push(action.payload);
        }
        
        // Add to shows by movie list if it exists and matches
        if (state.showsByMovie.length > 0 && 
            state.showsByMovie[0]?.movieId === action.payload.movieId) {
          state.showsByMovie.push(action.payload);
        }
      })
      .addCase(createShow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Show
      .addCase(updateShow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateShow.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Show updated successfully";
        
        // Update in shows list if it exists
        state.shows = state.shows.map(show => 
          show.id === action.payload.id ? action.payload : show
        );
        
        // Update in shows by theater list if it exists
        state.showsByTheater = state.showsByTheater.map(show => 
          show.id === action.payload.id ? action.payload : show
        );
        
        // Update in shows by movie list if it exists
        state.showsByMovie = state.showsByMovie.map(show => 
          show.id === action.payload.id ? action.payload : show
        );
        
        // Update show detail if it exists
        if (state.showDetail && state.showDetail.id === action.payload.id) {
          state.showDetail = action.payload;
        }
      })
      .addCase(updateShow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Show
      .addCase(deleteShow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteShow.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Show deleted successfully";
        
        // Remove from shows list if it exists
        state.shows = state.shows.filter(show => show.id !== action.payload);
        
        // Remove from shows by theater list if it exists
        state.showsByTheater = state.showsByTheater.filter(show => show.id !== action.payload);
        
        // Remove from shows by movie list if it exists
        state.showsByMovie = state.showsByMovie.filter(show => show.id !== action.payload);
        
        // Clear show detail if it's the deleted show
        if (state.showDetail && state.showDetail.id === action.payload) {
          state.showDetail = null;
        }
      })
      .addCase(deleteShow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Show By ID
      .addCase(getShowById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShowById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.showDetail = action.payload;
      })
      .addCase(getShowById.rejected, (state, action) => {
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
      
      // Get Shows By Theater And Screen
      .addCase(getShowsByTheaterAndScreen.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShowsByTheaterAndScreen.fulfilled, (state, action) => {
        state.isLoading = false;
        state.showsByScreen = action.payload;
      })
      .addCase(getShowsByTheaterAndScreen.rejected, (state, action) => {
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
      
      // Update Show Status
      .addCase(updateShowStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateShowStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Show status updated successfully";
        
        const { id, status } = action.payload;
        
        // Update in shows list if it exists
        state.shows = state.shows.map(show => 
          show.id === id ? { ...show, status } : show
        );
        
        // Update in shows by theater list if it exists
        state.showsByTheater = state.showsByTheater.map(show => 
          show.id === id ? { ...show, status } : show
        );
        
        // Update in shows by movie list if it exists
        state.showsByMovie = state.showsByMovie.map(show => 
          show.id === id ? { ...show, status } : show
        );
        
        // Update show detail if it exists
        if (state.showDetail && state.showDetail.id === id) {
          state.showDetail = { ...state.showDetail, status };
        }
      })
      .addCase(updateShowStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Seat Availability
      .addCase(updateSeatAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSeatAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Seat availability updated successfully";
      })
      .addCase(updateSeatAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Seat Availability
      .addCase(getSeatAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSeatAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.seatAvailability = action.payload;
      })
      .addCase(getSeatAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Show Analytics
      .addCase(getShowAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShowAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(getShowAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Trending Shows
      .addCase(getTrendingShows.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTrendingShows.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trendingShows = action.payload;
      })
      .addCase(getTrendingShows.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetShowState, clearShowError } = showSlice.actions;
export default showSlice.reducer;