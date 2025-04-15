// src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'users/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userService.getCustomers();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch customers');
    }
  }
);

export const fetchTheaterManagers = createAsyncThunk(
  'users/fetchTheaterManagers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userService.getTheaterManagers();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch theater managers');
    }
  }
);

export const deleteTheaterManager = createAsyncThunk(
  'users/deleteTheaterManager',
  async (id, { rejectWithValue }) => {
    try {
      await userService.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete theater manager');
    }
  }
);

export const getUserById = createAsyncThunk(
  'users/getUserById',
  async (id, { rejectWithValue }) => {
    try {
      return await userService.getUserById(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

// Initial state
const initialState = {
  customers: [],
  theaterManagers: [],
  customerDetails: null,
  loading: false,
  error: null
};

// Slice
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setCustomerDetails: (state, action) => {
      state.customerDetails = action.payload;
    },
    clearCustomerDetails: (state) => {
      state.customerDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       // Fetch Theater Managers
       .addCase(fetchTheaterManagers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheaterManagers.fulfilled, (state, action) => {
        state.loading = false;
        state.theaterManagers = action.payload;
      })
      .addCase(fetchTheaterManagers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Theater Manager
      .addCase(deleteTheaterManager.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTheaterManager.fulfilled, (state, action) => {
        state.loading = false;
        state.theaterManagers = state.theaterManagers.filter(
          manager => manager.id !== action.payload
        );
      })
      .addCase(deleteTheaterManager.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearUserError, setCustomerDetails, clearCustomerDetails } = userSlice.actions;

// Selectors
export const selectCustomers = (state) => state.users.customers;
export const selectTheaterManagers = (state) => state.users.theaterManagers;
export const selectCustomerDetails = (state) => state.users.customerDetails;
export const selectUserLoading = (state) => state.users.loading;
export const selectUserError = (state) => state.users.error;

export default userSlice.reducer;