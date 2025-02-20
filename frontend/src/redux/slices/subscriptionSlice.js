// src/redux/slices/subscriptionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionService from '../../services/subscriptionService';

export const fetchActivePlans = createAsyncThunk(
    'subscription/fetchActivePlans',
    async () => {
        const response = await subscriptionService.getActivePlans();
        return response;
    }
);

export const initiateSubscription = createAsyncThunk(
    'subscription/initiateSubscription',
    async ({ managerId, planId }) => {
        const subscription = await subscriptionService.initiateSubscription(managerId, planId);
        const payment = await subscriptionService.initiatePayment(subscription.id, subscription.amount);
        return payment;
    }
);

export const fetchManagerSubscription = createAsyncThunk(
    'subscription/fetchManagerSubscription',
    async (managerId) => {
        const response = await subscriptionService.getManagerActiveSubscription(managerId);
        return response;
    }
);

export const fetchSubscriptionHistory = createAsyncThunk(
    'subscription/fetchHistory',
    async (managerId) => {
        const response = await subscriptionService.getSubscriptionHistory(managerId);
        return response;
    }
);

const initialState = {
    plans: [],
    currentSubscription: null,
    subscriptionHistory: [],
    loading: false,
    error: null,
    paymentDetails: null
};

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setPaymentDetails: (state, action) => {
            state.paymentDetails = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Active Plans
            .addCase(fetchActivePlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActivePlans.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = action.payload;
            })
            .addCase(fetchActivePlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Initiate Subscription
            .addCase(initiateSubscription.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(initiateSubscription.fulfilled, (state, action) => {
                state.loading = false;
                state.paymentDetails = action.payload;
            })
            .addCase(initiateSubscription.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch Manager Subscription
            .addCase(fetchManagerSubscription.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchManagerSubscription.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSubscription = action.payload;
            })
            .addCase(fetchManagerSubscription.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch Subscription History
            .addCase(fetchSubscriptionHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSubscriptionHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.subscriptionHistory = action.payload;
            })
            .addCase(fetchSubscriptionHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { clearError, setPaymentDetails } = subscriptionSlice.actions;

// Selectors
export const selectSubscriptionPlans = (state) => state.subscription.plans;
export const selectSubscriptionLoading = (state) => state.subscription.loading;
export const selectSubscriptionError = (state) => state.subscription.error;
export const selectPaymentDetails = (state) => state.subscription.paymentDetails;
export const selectCurrentSubscription = (state) => state.subscription.currentSubscription;
export const selectSubscriptionHistory = (state) => state.subscription.subscriptionHistory;

export default subscriptionSlice.reducer;