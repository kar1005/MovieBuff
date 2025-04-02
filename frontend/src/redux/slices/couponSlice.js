// src/redux/slices/couponSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import couponService from "../../services/couponService";

// Async thunks for coupon operations
export const getAllCoupons = createAsyncThunk(
  "coupons/getAll",
  async ({ status, campaignId } = {}, { rejectWithValue }) => {
    try {
      return await couponService.getAllCoupons(status, campaignId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getCouponById = createAsyncThunk(
  "coupons/getById",
  async (id, { rejectWithValue }) => {
    try {
      return await couponService.getCouponById(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getCouponByCode = createAsyncThunk(
  "coupons/getByCode",
  async (code, { rejectWithValue }) => {
    try {
      return await couponService.getCouponByCode(code);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const createCoupon = createAsyncThunk(
  "coupons/create",
  async (couponData, { rejectWithValue }) => {
    try {
      return await couponService.createCoupon(couponData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateCoupon = createAsyncThunk(
  "coupons/update",
  async ({ id, couponData }, { rejectWithValue }) => {
    try {
      return await couponService.updateCoupon(id, couponData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  "coupons/delete",
  async (id, { rejectWithValue }) => {
    try {
      await couponService.deleteCoupon(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateCouponStatus = createAsyncThunk(
  "coupons/updateStatus",
  async ({ id, status, reason }, { rejectWithValue }) => {
    try {
      return await couponService.updateCouponStatus(id, status, reason);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const validateCoupon = createAsyncThunk(
  "coupons/validate",
  async ({ code, userId, movieId, theaterId, experience, city, bookingAmount }, { rejectWithValue }) => {
    try {
      return await couponService.validateCoupon(code, userId, movieId, theaterId, experience, city, bookingAmount);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getUserApplicableCoupons = createAsyncThunk(
  "coupons/getUserApplicable",
  async ({ userId, movieId, theaterId, bookingAmount }, { rejectWithValue }) => {
    try {
      return await couponService.getUserApplicableCoupons(userId, movieId, theaterId, bookingAmount);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getCouponAnalytics = createAsyncThunk(
  "coupons/getAnalytics",
  async ({ campaignId, startDate, endDate }, { rejectWithValue }) => {
    try {
      return await couponService.getCouponAnalytics(campaignId, startDate, endDate);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const initialState = {
  coupons: [],
  selectedCoupon: null,
  validatedCoupon: null,
  applicableCoupons: [],
  couponAnalytics: null,
  isLoading: false,
  error: null,
  success: false,
  message: ""
};

const couponSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    resetCouponState: (state) => {
      state.selectedCoupon = null;
      state.validatedCoupon = null;
      state.isLoading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearCouponError: (state) => {
      state.error = null;
    },
    clearValidatedCoupon: (state) => {
      state.validatedCoupon = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get All Coupons
      .addCase(getAllCoupons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.coupons = action.payload;
      })
      .addCase(getAllCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Coupon By ID
      .addCase(getCouponById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCouponById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCoupon = action.payload;
      })
      .addCase(getCouponById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Coupon By Code
      .addCase(getCouponByCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCouponByCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCoupon = action.payload;
      })
      .addCase(getCouponByCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Coupon
      .addCase(createCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Coupon created successfully";
        state.coupons.unshift(action.payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Coupon
      .addCase(updateCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Coupon updated successfully";
        state.coupons = state.coupons.map(coupon => 
          coupon.id === action.payload.id ? action.payload : coupon
        );
        if (state.selectedCoupon && state.selectedCoupon.id === action.payload.id) {
          state.selectedCoupon = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete Coupon
      .addCase(deleteCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Coupon deleted successfully";
        state.coupons = state.coupons.filter(coupon => coupon.id !== action.payload);
        if (state.selectedCoupon && state.selectedCoupon.id === action.payload) {
          state.selectedCoupon = null;
        }
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Coupon Status
      .addCase(updateCouponStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCouponStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Coupon status updated successfully";
        state.coupons = state.coupons.map(coupon => 
          coupon.id === action.payload.id ? action.payload : coupon
        );
        if (state.selectedCoupon && state.selectedCoupon.id === action.payload.id) {
          state.selectedCoupon = action.payload;
        }
      })
      .addCase(updateCouponStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Validate Coupon
      .addCase(validateCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.validatedCoupon = action.payload;
        state.success = action.payload.valid;
        state.message = action.payload.message;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.validatedCoupon = null;
      })
      
      // Get User Applicable Coupons
      .addCase(getUserApplicableCoupons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserApplicableCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applicableCoupons = action.payload;
      })
      .addCase(getUserApplicableCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Coupon Analytics
      .addCase(getCouponAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCouponAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.couponAnalytics = action.payload;
      })
      .addCase(getCouponAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetCouponState, clearCouponError, clearValidatedCoupon } = couponSlice.actions;
export default couponSlice.reducer;