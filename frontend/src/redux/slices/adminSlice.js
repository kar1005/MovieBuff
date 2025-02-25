// src/redux/slices/adminSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import movieService from '../../services/movieService';
import actorService from '../../services/actorService';
import userService from '../../services/userService';
import subscriptionService from '../../services/subscriptionService';

// Async Thunks for Movies
export const fetchMovies = createAsyncThunk(
  'admin/fetchMovies',
  async (filters) => {
    const response = await movieService.getAllMovies(filters);
    return response;
  }
);

export const fetchMovieById = createAsyncThunk(
  'admin/fetchMovieById',
  async (id) => {
    const response = await movieService.getMovieById(id);
    return response;
  }
);

export const createMovie = createAsyncThunk(
  'admin/createMovie',
  async (movieData) => {
    const response = await movieService.createMovie(movieData);
    return response;
  }
);

export const updateMovie = createAsyncThunk(
  'admin/updateMovie',
  async ({ id, data }) => {
    const response = await movieService.updateMovie(id, data);
    return response;
  }
);

export const deleteMovie = createAsyncThunk(
  'admin/deleteMovie',
  async (id) => {
    await movieService.deleteMovie(id);
    return id;
  }
);

// Async Thunks for Actors
export const fetchActors = createAsyncThunk(
  'admin/fetchActors',
  async (filters) => {
    const response = await actorService.getAllActors(filters);
    return response;
  }
);

export const createActor = createAsyncThunk(
  'admin/createActor',
  async (actorData) => {
    const response = await actorService.createActor(actorData);
    return response;
  }
);

export const updateActor = createAsyncThunk(
  'admin/updateActor',
  async ({ id, data }) => {
    const response = await actorService.updateActor(id, data);
    return response;
  }
);

export const deleteActor = createAsyncThunk(
  'admin/deleteActor',
  async (id) => {
    await actorService.deleteActor(id);
    return id;
  }
);

// Async Thunks for Users
export const fetchCustomers = createAsyncThunk(
  'admin/fetchCustomers',
  async () => {
    const response = await userService.getCustomers();
    return response;
  }
);

export const fetchTheaterManagers = createAsyncThunk(
  'admin/fetchTheaterManagers',
  async () => {
    const response = await userService.getTheaterManagers();
    return response;
  }
);

// Async Thunks for Subscription Plans
export const fetchSubscriptionPlans = createAsyncThunk(
  'admin/fetchSubscriptionPlans',
  async () => {
    const response = await subscriptionService.getAllPlans();
    return response;
  }
);

export const createSubscriptionPlan = createAsyncThunk(
  'admin/createSubscriptionPlan',
  async (planData) => {
    const response = await subscriptionService.createPlan(planData);
    return response;
  }
);

export const updateSubscriptionPlan = createAsyncThunk(
  'admin/updateSubscriptionPlan',
  async ({ id, data }) => {
    const response = await subscriptionService.updatePlan(id, data);
    return response;
  }
);

const initialState = {
  // Movies
  movies: {
    data: [],
    currentMovie: null,
    totalPages: 0,
    loading: false,
    error: null
  },
  
  // Actors
  actors: {
    data: [],
    currentActor: null,
    totalPages: 0,
    loading: false,
    error: null
  },
  
  // Users
  users: {
    customers: [],
    theaterManagers: [],
    loading: false,
    error: null
  },
  
  // Reviews
  reviews: {
    data: [],
    loading: false,
    error: null
  },
  
  // Subscription Plans
  subscriptionPlans: {
    data: [],
    loading: false,
    error: null
  },
  
  // Dashboard Stats
  dashboardStats: {
    totalMovies: 0,
    totalCustomers: 0,
    totalTheaters: 0,
    totalBookings: 0,
    recentMovies: [],
    upcomingMovies: [],
    loading: false,
    error: null
  }
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearMovieError: (state) => {
      state.movies.error = null;
    },
    clearActorError: (state) => {
      state.actors.error = null;
    },
    clearUserError: (state) => {
      state.users.error = null;
    },
    setCurrentMovie: (state, action) => {
      state.movies.currentMovie = action.payload;
    },
    setCurrentActor: (state, action) => {
      state.actors.currentActor = action.payload;
    },
    updateDashboardStats: (state, action) => {
      state.dashboardStats = { ...state.dashboardStats, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    // Movies
    builder
      // Fetch movie by ID
      .addCase(fetchMovieById.pending, (state) => {
        state.movies.loading = true;
        state.movies.error = null;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.movies.loading = false;
        state.movies.currentMovie = action.payload;
      })
      .addCase(fetchMovieById.rejected, (state, action) => {
        state.movies.loading = false;
        state.movies.error = action.error.message;
      })
      
      // Fetch movies list
      .addCase(fetchMovies.pending, (state) => {
        state.movies.loading = true;
        state.movies.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.movies.loading = false;
        state.movies.data = action.payload.content;
        state.movies.totalPages = action.payload.totalPages;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.movies.loading = false;
        state.movies.error = action.error.message;
      })
      .addCase(createMovie.fulfilled, (state, action) => {
        state.movies.data.push(action.payload);
      })
      .addCase(updateMovie.fulfilled, (state, action) => {
        const index = state.movies.data.findIndex(movie => movie.id === action.payload.id);
        if (index !== -1) {
          state.movies.data[index] = action.payload;
        }
      })
      .addCase(deleteMovie.fulfilled, (state, action) => {
        state.movies.data = state.movies.data.filter(movie => movie.id !== action.payload);
      })

    // Actors
      .addCase(fetchActors.pending, (state) => {
        state.actors.loading = true;
        state.actors.error = null;
      })
      .addCase(fetchActors.fulfilled, (state, action) => {
        state.actors.loading = false;
        state.actors.data = action.payload.content;
        state.actors.totalPages = action.payload.totalPages;
      })
      .addCase(fetchActors.rejected, (state, action) => {
        state.actors.loading = false;
        state.actors.error = action.error.message;
      })
      .addCase(createActor.fulfilled, (state, action) => {
        state.actors.data.push(action.payload);
      })
      .addCase(updateActor.fulfilled, (state, action) => {
        const index = state.actors.data.findIndex(actor => actor.id === action.payload.id);
        if (index !== -1) {
          state.actors.data[index] = action.payload;
        }
      })
      .addCase(deleteActor.fulfilled, (state, action) => {
        state.actors.data = state.actors.data.filter(actor => actor.id !== action.payload);
      })

    // Users
      .addCase(fetchCustomers.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.error.message;
      })
      .addCase(fetchTheaterManagers.fulfilled, (state, action) => {
        state.users.theaterManagers = action.payload;
      })

    // Subscription Plans
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.subscriptionPlans.loading = true;
        state.subscriptionPlans.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.subscriptionPlans.loading = false;
        state.subscriptionPlans.data = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.subscriptionPlans.loading = false;
        state.subscriptionPlans.error = action.error.message;
      })
      .addCase(createSubscriptionPlan.fulfilled, (state, action) => {
        state.subscriptionPlans.data.push(action.payload);
      })
      .addCase(updateSubscriptionPlan.fulfilled, (state, action) => {
        const index = state.subscriptionPlans.data.findIndex(plan => plan.id === action.payload.id);
        if (index !== -1) {
          state.subscriptionPlans.data[index] = action.payload;
        }
      });
  }
});

// Selectors
export const selectMovies = (state) => state.admin.movies;
export const selectActors = (state) => state.admin.actors;
export const selectUsers = (state) => state.admin.users;
export const selectReviews = (state) => state.admin.reviews;
export const selectSubscriptionPlans = (state) => state.admin.subscriptionPlans;
export const selectDashboardStats = (state) => state.admin.dashboardStats;

export const {
  clearMovieError,
  clearActorError,
  clearUserError,
  setCurrentMovie,
  setCurrentActor,
  updateDashboardStats
} = adminSlice.actions;

export default adminSlice.reducer;