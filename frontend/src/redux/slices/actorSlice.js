// src/redux/slices/actorSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import actorService from "../../services/actorService";
import cloudinaryService from '../../services/cloudinaryService';

// Initial state
const initialState = {
  actors: {
    content: [],
    totalElements: 0,
    totalPages: 0,
    last: true,
    first: true,
    empty: true,
  },
  currentActor: null,
  loading: false,
  error: null,
  searchResults: [],
  trendingActors: [],
  imageUploading: false,
  currentImageUrl: null,
};

// Async Thunks
export const fetchActors = createAsyncThunk(
  "actors/fetchActors",
  async ({ page = 0, size = 10, filters = {} }, { rejectWithValue }) => {
    try {
      return await actorService.getAllActors(filters, page, size);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const fetchActorById = createAsyncThunk(
  "actors/fetchActorById",
  async (id, { rejectWithValue }) => {
    try {
      return await actorService.getActorById(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

// export const createActor = createAsyncThunk(
//     'actors/createActor',
//     async (actorData, { rejectWithValue }) => {
//         try {
//             return await actorService.createActor(actorData);
//         } catch (error) {
//             return rejectWithValue(error.toString());
//         }
//     }
// );

export const deleteActorImage = createAsyncThunk(
  "actors/deleteImage",
  async (publicId, { rejectWithValue }) => {
    try {
      await cloudinaryService.deleteImage(publicId);
      return publicId;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

// Update the updateActor thunk to handle image changes
export const updateActor = createAsyncThunk(
  "actors/updateActor",
  async (
    { id, actorData, oldImagePublicId },
    { rejectWithValue, dispatch }
  ) => {
    try {
      // If there's an old image and it's being replaced, delete it
      if (oldImagePublicId && actorData.imageUrl !== oldImagePublicId) {
        await dispatch(deleteActorImage(oldImagePublicId)).unwrap();
      }

      // Format the dates
      const formattedData = {
        ...actorData,
        dateOfBirth: actorData.dateOfBirth
          ? new Date(actorData.dateOfBirth).toISOString()
          : null,
        careerStartDate: actorData.careerStartDate
          ? new Date(actorData.careerStartDate).toISOString()
          : null,
      };

      const response = await actorService.updateActor(id, formattedData);
      return response;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const deleteActor = createAsyncThunk(
  "actors/deleteActor",
  async (id, { rejectWithValue }) => {
    try {
      await actorService.deleteActor(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const searchActors = createAsyncThunk(
  "actors/searchActors",
  async ({ query, limit = 10 }, { rejectWithValue }) => {
    try {
      return await actorService.searchActors(query, limit);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const fetchActorsByMovie = createAsyncThunk(
  "actors/fetchActorsByMovie",
  async (movieId, { rejectWithValue }) => {
    try {
      return await actorService.getActorsByMovie(movieId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateFilmography = createAsyncThunk(
  "actors/updateFilmography",
  async ({ actorId, filmographyData }, { rejectWithValue }) => {
    try {
      return await actorService.updateFilmography(actorId, filmographyData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const fetchTrendingActors = createAsyncThunk(
  "actors/fetchTrendingActors",
  async (limit = 10, { rejectWithValue }) => {
    try {
      return await actorService.getTrendingActors(limit);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const toggleActorProfileStatus = createAsyncThunk(
  "actors/toggleProfileStatus",
  async (actorId, { rejectWithValue }) => {
    try {
      return await actorService.toggleProfileStatus(actorId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const uploadActorImage = createAsyncThunk(
  "actors/uploadImage",
  async (file, { rejectWithValue }) => {
    try {
      const result = await cloudinaryService.uploadImage(file, "actors");
      return result.url;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

// Update the createActor thunk to handle both data and image
export const createActor = createAsyncThunk(
  "actors/createActor",
  async (actorData, { rejectWithValue }) => {
    try {
      // Format the dates
      const formattedData = {
        ...actorData,
        dateOfBirth: actorData.dateOfBirth
          ? new Date(actorData.dateOfBirth).toISOString()
          : null,
        careerStartDate: actorData.careerStartDate
          ? new Date(actorData.careerStartDate).toISOString()
          : null,
      };

      const response = await actorService.createActor(formattedData);
      return response;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

// Actor Slice
const actorSlice = createSlice({
  name: "actors",
  initialState,
  reducers: {
    clearActorError: (state) => {
      state.error = null;
    },
    clearCurrentActor: (state) => {
      state.currentActor = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Actors
      .addCase(fetchActors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActors.fulfilled, (state, action) => {
        state.loading = false;
        state.actors = action.payload;
      })
      .addCase(fetchActors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Actor By Id
      .addCase(fetchActorById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActorById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentActor = action.payload;
      })
      .addCase(fetchActorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Actor
      .addCase(createActor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createActor.fulfilled, (state, action) => {
        state.loading = false;
        state.actors.content.unshift(action.payload);
        state.actors.totalElements += 1;
      })
      .addCase(createActor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //uploadActorImage
      .addCase(uploadActorImage.pending, (state) => {
        state.imageUploading = true;
        state.error = null;
      })
      .addCase(uploadActorImage.fulfilled, (state, action) => {
        state.imageUploading = false;
        state.currentImageUrl = action.payload;
      })
      .addCase(uploadActorImage.rejected, (state, action) => {
        state.imageUploading = false;
        state.error = action.payload;
      })

      // Update Actor
      .addCase(updateActor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateActor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.actors.content.findIndex(
          (actor) => actor.id === action.payload.id
        );
        if (index !== -1) {
          state.actors.content[index] = action.payload;
        }
        if (state.currentActor?.id === action.payload.id) {
          state.currentActor = action.payload;
        }
      })
      .addCase(updateActor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Actor
      .addCase(deleteActor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteActor.fulfilled, (state, action) => {
        state.loading = false;
        state.actors.content = state.actors.content.filter(
          (actor) => actor.id !== action.payload
        );
        state.actors.totalElements -= 1;
        if (state.currentActor?.id === action.payload) {
          state.currentActor = null;
        }
      })
      .addCase(deleteActor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Search Actors
      .addCase(searchActors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchActors.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchActors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Actors By Movie
      .addCase(fetchActorsByMovie.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })

      // Update Filmography
      .addCase(updateFilmography.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentActor?.id === action.payload.id) {
          state.currentActor = action.payload;
        }
        const index = state.actors.content.findIndex(
          (actor) => actor.id === action.payload.id
        );
        if (index !== -1) {
          state.actors.content[index] = action.payload;
        }
      })

      // Fetch Trending Actors
      .addCase(fetchTrendingActors.fulfilled, (state, action) => {
        state.loading = false;
        state.trendingActors = action.payload;
      })

      // Toggle Actor Profile Status
      .addCase(toggleActorProfileStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentActor?.id === action.payload.id) {
          state.currentActor = action.payload;
        }
        const index = state.actors.content.findIndex(
          (actor) => actor.id === action.payload.id
        );
        if (index !== -1) {
          state.actors.content[index] = action.payload;
        }
      })

      // Delete Image
      .addCase(deleteActorImage.pending, (state) => {
        state.imageDeleting = true;
      })
      .addCase(deleteActorImage.fulfilled, (state) => {
        state.imageDeleting = false;
        state.currentImageUrl = null;
      })
      .addCase(deleteActorImage.rejected, (state, action) => {
        state.imageDeleting = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { clearActorError, clearCurrentActor, clearSearchResults } =
  actorSlice.actions;

// Export selectors
export const selectAllActors = (state) => state.actors.actors;
export const selectCurrentActor = (state) => state.actors.currentActor;
export const selectActorLoading = (state) => state.actors.loading;
export const selectActorError = (state) => state.actors.error;
export const selectSearchResults = (state) => state.actors.searchResults;
export const selectTrendingActors = (state) => state.actors.trendingActors;
export const selectImageUploading = (state) => state.actors.imageUploading;
export const selectCurrentImageUrl = (state) => state.actors.currentImageUrl;
// Export reducer
export default actorSlice.reducer;
