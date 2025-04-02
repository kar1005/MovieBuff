// src/redux/slices/bookingSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import bookingService from "../../services/bookingService";

// Async thunks for booking operations
export const initiateBooking = createAsyncThunk(
  "booking/initiate",
  async (bookingData, { rejectWithValue }) => {
    try {
      return await bookingService.initiateBooking(bookingData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const confirmBooking = createAsyncThunk(
  "booking/confirm",
  async (paymentData, { rejectWithValue }) => {
    try {
      return await bookingService.confirmBooking(paymentData);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getUserBookings = createAsyncThunk(
  "booking/getUserBookings",
  async (userId, { rejectWithValue }) => {
    try {
      return await bookingService.getUserBookings(userId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getBookingById = createAsyncThunk(
  "booking/getById",
  async (id, { rejectWithValue }) => {
    try {
      return await bookingService.getBookingById(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getBookingByNumber = createAsyncThunk(
  "booking/getByNumber",
  async (bookingNumber, { rejectWithValue }) => {
    try {
      return await bookingService.getBookingByNumber(bookingNumber);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const cancelBooking = createAsyncThunk(
  "booking/cancel",
  async ({ id, reason, cancelledBy }, { rejectWithValue }) => {
    try {
      return await bookingService.cancelBooking(id, reason, cancelledBy);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const requestRefund = createAsyncThunk(
  "booking/requestRefund",
  async (id, { rejectWithValue }) => {
    try {
      return await bookingService.requestRefund(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const generateTicket = createAsyncThunk(
  "booking/generateTicket",
  async (id, { rejectWithValue }) => {
    try {
      return await bookingService.generateTicket(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getTicketQRCode = createAsyncThunk(
  "booking/getQRCode",
  async (id, { rejectWithValue }) => {
    try {
      return await bookingService.getTicketQRCode(id);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const sendTicketNotification = createAsyncThunk(
  "booking/sendNotification",
  async ({ id, notificationOptions }, { rejectWithValue }) => {
    try {
      return await bookingService.sendTicketNotification(id, notificationOptions);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const getBookingAnalytics = createAsyncThunk(
  "booking/getAnalytics",
  async (params, { rejectWithValue }) => {
    try {
      const { startDate, endDate, movieId, theaterId } = params || {};
      return await bookingService.getBookingAnalytics(startDate, endDate, movieId, theaterId);
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const initialState = {
  currentBooking: null,
  userBookings: [],
  selectedBooking: null,
  qrCode: null,
  analytics: null,
  isLoading: false,
  error: null,
  success: false,
  message: ""
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    resetBookingState: (state) => {
      state.currentBooking = null;
      state.isLoading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearBookingError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initiate Booking
      .addCase(initiateBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiateBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
        state.success = true;
        state.message = "Booking initiated successfully";
      })
      .addCase(initiateBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Confirm Booking
      .addCase(confirmBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
        state.success = true;
        state.message = "Booking confirmed successfully";
        // Add confirmed booking to user bookings if it exists
        if (state.userBookings.length > 0) {
          state.userBookings.unshift(action.payload);
        }
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get User Bookings
      .addCase(getUserBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userBookings = action.payload;
      })
      .addCase(getUserBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Booking By ID
      .addCase(getBookingById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getBookingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedBooking = action.payload;
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Booking By Number
      .addCase(getBookingByNumber.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getBookingByNumber.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedBooking = action.payload;
      })
      .addCase(getBookingByNumber.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Cancel Booking
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Booking cancelled successfully";
        
        // Update selected booking if it exists
        if (state.selectedBooking && state.selectedBooking.id === action.payload.id) {
          state.selectedBooking = action.payload;
        }
        
        // Update in user bookings if it exists
        state.userBookings = state.userBookings.map(booking => 
          booking.id === action.payload.id ? action.payload : booking
        );
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Request Refund
      .addCase(requestRefund.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestRefund.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Refund requested successfully";
        
        // Update selected booking if it exists
        if (state.selectedBooking && state.selectedBooking.id === action.payload.id) {
          state.selectedBooking = action.payload;
        }
        
        // Update in user bookings if it exists
        state.userBookings = state.userBookings.map(booking => 
          booking.id === action.payload.id ? action.payload : booking
        );
      })
      .addCase(requestRefund.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Generate Ticket
      .addCase(generateTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Ticket generated successfully";
        
        // Update selected booking if it exists
        if (state.selectedBooking && state.selectedBooking.id === action.payload.id) {
          state.selectedBooking = action.payload;
        }
        
        // Update in user bookings if it exists
        state.userBookings = state.userBookings.map(booking => 
          booking.id === action.payload.id ? action.payload : booking
        );
      })
      .addCase(generateTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Ticket QR Code
      .addCase(getTicketQRCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTicketQRCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.qrCode = action.payload;
      })
      .addCase(getTicketQRCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Send Ticket Notification
      .addCase(sendTicketNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendTicketNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.message = "Notification sent successfully";
        
        // Update selected booking if it exists
        if (state.selectedBooking && state.selectedBooking.id === action.payload.id) {
          state.selectedBooking = action.payload;
        }
        
        // Update in user bookings if it exists
        state.userBookings = state.userBookings.map(booking => 
          booking.id === action.payload.id ? action.payload : booking
        );
      })
      .addCase(sendTicketNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Booking Analytics
      .addCase(getBookingAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getBookingAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(getBookingAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetBookingState, clearBookingError } = bookingSlice.actions;
export default bookingSlice.reducer;