// src/redux/slices/theaterSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import theaterService from '../../services/theaterService';

const initialState = {
  theaters: [],
  shows: [],
  currentTheater: null,
  screenLayout: null,
  loading: false,
  error: null,
  screens: {},  
  stats: null, 
};

// Existing Thunks
export const createTheater = createAsyncThunk(
  'theater/createTheater',
  async (theaterData) => {
    const response = await theaterService.createTheater(theaterData);
    return response;
  }
);

export const fetchTheaters = createAsyncThunk(
  'theater/fetchTheaters',
  async () => {
    const response = await theaterService.getAllTheaters();
    return response;
  }
);

export const updateTheaterAsync = createAsyncThunk(
  'theater/updateTheater',
  async ({ id, data }) => {
    console.log("theaterSlice : ",JSON.stringify(data.location));
    const response = await theaterService.updateTheater(id, data);

    return response;
  }
);

export const deleteTheaterAsync = createAsyncThunk(
  'theater/deleteTheater',
  async (id) => {
    await theaterService.deleteTheater(id);
    return id;
  }
);

export const fetchTheaterById = createAsyncThunk(
  'theater/fetchTheaterById',
  async (id) => {
    const response = await theaterService.getTheaterById(id);
    return response;
  }
);

export const fetchManagerTheaters = createAsyncThunk(
  'theaters/fetchByManager',
  async (managerId) => {
      const response = await theaterService.getTheatersByManagerId(managerId);      
      return response[0];
  }
);

export const fetchTheaterStats = createAsyncThunk(
  'theater/fetchTheaterStats',
  async (theaterId, { rejectWithValue }) => {
    try {
      console.log("Fetching the stat called");
      
      const response = await theaterService.getTheaterStats(theaterId);
      console.log(JSON.stringify(response) , theaterId);
      
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch theater stats');
    }
  }
);



export const addScreen = createAsyncThunk(
  'theater/addScreen',
  async ({ theaterId, data }, { rejectWithValue }) => {
    try {
      const response = await theaterService.addScreen(theaterId, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add screen');
    }
  }
);

export const updateScreen = createAsyncThunk(
  'theater/updateScreen',
  async ({ theaterId, screenId, data }, { rejectWithValue }) => {
    try {
      const response = await theaterService.updateScreen(theaterId, screenId, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update screen');
    }
  }
);

export const deleteScreen = createAsyncThunk(
  'theater/deleteScreen',
  async ({ theaterId, screenNumber }, { rejectWithValue }) => {
    try {
      await theaterService.deleteScreen(theaterId, screenNumber);
      return { theaterId, screenNumber };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete screen');
    }
  }
);

export const fetchTheaterScreens = createAsyncThunk(
  'theater/fetchTheaterScreens',
  async (theaterId, { rejectWithValue }) => {
    try {
      const response = await theaterService.getAllScreens(theaterId);
      return { theaterId, screens: response };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch screens');
    }
  }
);













const theaterSlice = createSlice({
  name: 'theater',
  initialState,
  reducers: {
    setScreenLayout: (state, action) => {
      state.screenLayout = action.payload;
    },
    setShows: (state, action) => {
      state.shows = action.payload;
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
    resetTheaterError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Theater
      .addCase(createTheater.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTheater.fulfilled, (state, action) => {
        state.loading = false;
        state.theaters.push(action.payload);
      })
      .addCase(createTheater.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch Theaters
      .addCase(fetchTheaters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheaters.fulfilled, (state, action) => {
        state.loading = false;
        state.theaters = action.payload;
      })
      .addCase(fetchTheaters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchManagerTheaters.pending, (state) => {
        state.loading = true;
    })
    .addCase(fetchManagerTheaters.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTheater = action.payload;
    })
    .addCase(fetchManagerTheaters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
    })

      // Update Theater
      .addCase(updateTheaterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTheaterAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.theaters.findIndex(theater => theater.id === action.payload.id);
        if (index !== -1) {
          state.theaters[index] = action.payload;
        }
      })
      .addCase(updateTheaterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete Theater
      .addCase(deleteTheaterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTheaterAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.theaters = state.theaters.filter(theater => theater.id !== action.payload);
      })
      .addCase(deleteTheaterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteScreen.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteScreen.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the deleted screen from the screens list
        if (state.screens[action.payload.theaterId]) {
          state.screens[action.payload.theaterId] = state.screens[action.payload.theaterId]
            .filter(screen => screen.screenNumber !== action.payload.screenNumber);
        }
        // Update total screens count in current theater
        if (state.currentTheater) {
          state.currentTheater.totalScreens = (state.currentTheater.totalScreens || 1) - 1;
        }
      })
      .addCase(deleteScreen.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Theater By Id
      .addCase(fetchTheaterById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheaterById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTheater = action.payload;
      })
      .addCase(fetchTheaterById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch Theater Screens
      .addCase(fetchTheaterScreens.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheaterScreens.fulfilled, (state, action) => {
        state.loading = false;
        state.screens[action.payload.theaterId] = action.payload.screens;
      })
      .addCase(fetchTheaterScreens.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Theater Stats
      .addCase(fetchTheaterStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheaterStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTheaterStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })





      // Add these to your extraReducers in theaterSlice.js
.addCase(addScreen.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(addScreen.fulfilled, (state, action) => {
  state.loading = false;
  if (state.currentTheater) {
    state.currentTheater.screens = state.currentTheater.screens || [];
    state.currentTheater.screens.push(action.payload);
  }
})
.addCase(addScreen.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
.addCase(updateScreen.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(updateScreen.fulfilled, (state, action) => {
  state.loading = false;
  if (state.currentTheater) {
    const index = state.currentTheater.screens.findIndex(
      screen => screen.screenNumber === action.payload.screenNumber
    );
    if (index !== -1) {
      state.currentTheater.screens[index] = action.payload;
    }
  }
})
.addCase(updateScreen.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})
  }
});

export const {
  setScreenLayout,
  setShows,
  addShow,
  updateShow,
  deleteShow,
  resetTheaterError
} = theaterSlice.actions;

// Selectors
export const selectTheaters = (state) => state.theater.theaters;
export const selectShows = (state) => state.theater.shows;
export const selectCurrentTheater = (state) => state.theater.currentTheater;
export const selectScreenLayout = (state) => state.theater.screenLayout;
export const selectLoading = (state) => state.theater.loading;
export const selectError = (state) => state.theater.error;
export const selectTheaterStats = (state) => state.theater.stats;
export const selectScreensByTheaterId = (state, theaterId) => state.theater.screens[theaterId];

export default theaterSlice.reducer;