// src/redux/slices/movieSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import movieService from "../../services/movieService";

// Async thunks for movie operations
export const getAllMovies = createAsyncThunk(
  "movies/getAll",
  async ({ filters, page, size }, { rejectWithValue }) => {
    try {
      return await movieService.getAllMovies(filters, page, size);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getMovieById = createAsyncThunk(
  "movies/getById",
  async (id, { rejectWithValue }) => {
    try {
      return await movieService.getMovieById(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const createMovie = createAsyncThunk(
  "movies/create",
  async (movieData, { rejectWithValue }) => {
    try {
      return await movieService.createMovie(movieData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateMovie = createAsyncThunk(
  "movies/update",
  async ({ id, movieData }, { rejectWithValue }) => {
    try {
      return await movieService.updateMovie(id, movieData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const deleteMovie = createAsyncThunk(
  "movies/delete",
  async (id, { rejectWithValue }) => {
    try {
      await movieService.deleteMovie(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getTrendingMovies = createAsyncThunk(
  "movies/trending",
  async (limit = 10, { rejectWithValue }) => {
    try {
      return await movieService.getTrendingMovies(limit);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getUpcomingMovies = createAsyncThunk(
  "movies/upcoming",
  async (limit = 10, { rejectWithValue }) => {
    try {
      return await movieService.getUpcomingMovies(limit);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const searchMovies = createAsyncThunk(
  "movies/search",
  async ({ query, limit }, { rejectWithValue }) => {
    try {
      return await movieService.searchMovies(query, limit);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateMovieCast = createAsyncThunk(
  "movies/updateCast",
  async ({ movieId, castData }, { rejectWithValue }) => {
    try {
      return await movieService.updateMovieCast(movieId, castData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateMovieStatistics = createAsyncThunk(
  "movies/updateStatistics",
  async ({ movieId, statistics }, { rejectWithValue }) => {
    try {
      return await movieService.updateMovieStatistics(movieId, statistics);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateMovieRating = createAsyncThunk(
  "movies/updateRating",
  async ({ movieId, rating }, { rejectWithValue }) => {
    try {
      return await movieService.updateMovieRating(movieId, rating);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getMovieStatistics = createAsyncThunk(
  "movies/getStatistics",
  async (movieId, { rejectWithValue }) => {
    try {
      return await movieService.getMovieStatistics(movieId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getMoviesByActor = createAsyncThunk(
  "movies/getByActor",
  async (actorId, { rejectWithValue }) => {
    try {
      return await movieService.getMoviesByActor(actorId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const initialState = {
  movies: [],
  movieDetail: null,
  trendingMovies: [],
  upcomingMovies: [],
  searchResults: [],
  actorMovies: [],
  statistics: null,
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  },
  isLoading: false,
  error: null,
  success: false,
  message: ""
};

const movieSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    resetMovieState: (state) => {
      state.movieDetail = null;
      state.isLoading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearMovieError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setSize: (state, action) => {
      state.pagination.size = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get All Movies
      .addCase(getAllMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movies = action.payload.content;
        state.pagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(getAllMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Movie By ID
      .addCase(getMovieById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMovieById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movieDetail = action.payload;
      })
      .addCase(getMovieById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Movie
      .addCase(createMovie.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMovie.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Movie created successfully";
        // Add to movies list if it exists
        if (state.movies.length > 0) {
          state.movies.unshift(action.payload);
        }
      })
      .addCase(createMovie.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Movie
      .addCase(updateMovie.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMovie.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Movie updated successfully";
        
        // Update in movie list if it exists
        state.movies = state.movies.map(movie => 
          movie.id === action.payload.id ? action.payload : movie
        );
        
        // Update movie detail if it exists
        if (state.movieDetail && state.movieDetail.id === action.payload.id) {
          state.movieDetail = action.payload;
        }
      })
      .addCase(updateMovie.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Movie
      .addCase(deleteMovie.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMovie.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Movie deleted successfully";
        
        // Remove from movies list
        state.movies = state.movies.filter(movie => movie.id !== action.payload);
        
        // Clear movie detail if it's the deleted movie
        if (state.movieDetail && state.movieDetail.id === action.payload) {
          state.movieDetail = null;
        }
      })
      .addCase(deleteMovie.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Trending Movies
      .addCase(getTrendingMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTrendingMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trendingMovies = action.payload;
      })
      .addCase(getTrendingMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Upcoming Movies
      .addCase(getUpcomingMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUpcomingMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.upcomingMovies = action.payload;
      })
      .addCase(getUpcomingMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Search Movies
      .addCase(searchMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Movie Cast
      .addCase(updateMovieCast.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMovieCast.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Movie cast updated successfully";
        
        // Update in movie list if it exists
        state.movies = state.movies.map(movie => 
          movie.id === action.payload.id ? action.payload : movie
        );
        
        // Update movie detail if it exists
        if (state.movieDetail && state.movieDetail.id === action.payload.id) {
          state.movieDetail = action.payload;
        }
      })
      .addCase(updateMovieCast.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Movie Statistics
      .addCase(updateMovieStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMovieStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Movie statistics updated successfully";
        
        // Update in movie list if it exists
        state.movies = state.movies.map(movie => 
          movie.id === action.payload.id ? action.payload : movie
        );
        
        // Update movie detail if it exists
        if (state.movieDetail && state.movieDetail.id === action.payload.id) {
          state.movieDetail = action.payload;
        }
      })
      .addCase(updateMovieStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Movie Rating
      .addCase(updateMovieRating.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMovieRating.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Movie rating updated successfully";
        
        // Update in movie list if it exists
        state.movies = state.movies.map(movie => 
          movie.id === action.payload.id ? action.payload : movie
        );
        
        // Update movie detail if it exists
        if (state.movieDetail && state.movieDetail.id === action.payload.id) {
          state.movieDetail = action.payload;
        }
      })
      .addCase(updateMovieRating.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Movie Statistics
      .addCase(getMovieStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMovieStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload;
      })
      .addCase(getMovieStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Movies By Actor
      .addCase(getMoviesByActor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMoviesByActor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.actorMovies = action.payload;
      })
      .addCase(getMoviesByActor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetMovieState, clearMovieError, setPage, setSize } = movieSlice.actions;
export default movieSlice.reducer;