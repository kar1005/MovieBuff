// src/redux/slices/subscriptionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionService from '../../services/subscriptionService';
import paymentService from '../../services/paymentService';

// Subscription Plans
export const fetchActivePlans = createAsyncThunk(
    'subscription/fetchActivePlans',
    async (_, { rejectWithValue }) => {
        try {
            return await subscriptionService.getActivePlans();
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const fetchAllPlans = createAsyncThunk(
    'subscription/fetchAllPlans',
    async ({ activeOnly, duration } = {}, { rejectWithValue }) => {
        try {
            return await subscriptionService.getAllPlans(activeOnly, duration);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const fetchPlanById = createAsyncThunk(
    'subscription/fetchPlanById',
    async (id, { rejectWithValue }) => {
        try {
            return await subscriptionService.getPlanById(id);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const createPlan = createAsyncThunk(
    'subscription/createPlan',
    async (planData, { rejectWithValue }) => {
        try {
            return await subscriptionService.createPlan(planData);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const updatePlan = createAsyncThunk(
    'subscription/updatePlan',
    async ({ id, planData }, { rejectWithValue }) => {
        try {
            return await subscriptionService.updatePlan(id, planData);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const deletePlan = createAsyncThunk(
    'subscription/deletePlan',
    async (id, { rejectWithValue }) => {
        try {
            await subscriptionService.deletePlan(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const togglePlanStatus = createAsyncThunk(
    'subscription/togglePlanStatus',
    async (id, { rejectWithValue }) => {
        try {
            return await subscriptionService.togglePlanStatus(id);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

// Subscriptions
export const initiateSubscription = createAsyncThunk(
    'subscription/initiateSubscription',
    async ({ managerId, planId }, { rejectWithValue }) => {
        try {
            const subscription = await subscriptionService.initiateSubscription(managerId, planId);
            return subscription;
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const initiatePayment = createAsyncThunk(
    'subscription/initiatePayment',
    async ({ subscriptionId, amount, currency = 'INR' }, { rejectWithValue }) => {
        try {
            return await paymentService.initiateSubscriptionPayment(subscriptionId, amount, currency);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const verifyPayment = createAsyncThunk(
    'subscription/verifyPayment',
    async (paymentData, { rejectWithValue }) => {
        try {
            return await paymentService.verifySubscriptionPayment(paymentData);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const fetchSubscription = createAsyncThunk(
    'subscription/fetchSubscription',
    async (id, { rejectWithValue }) => {
        try {
            return await subscriptionService.getSubscription(id);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const fetchManagerSubscription = createAsyncThunk(
    'subscription/fetchManagerSubscription',
    async (managerId, { rejectWithValue }) => {
        try {
            return await subscriptionService.getManagerActiveSubscription(managerId);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const fetchSubscriptionHistory = createAsyncThunk(
    'subscription/fetchHistory',
    async (managerId, { rejectWithValue }) => {
        try {
            return await subscriptionService.getSubscriptionHistory(managerId);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

export const checkSubscriptionStatus = createAsyncThunk(
    'subscription/checkStatus',
    async (managerId, { rejectWithValue }) => {
        try {
            return await subscriptionService.checkSubscriptionStatus(managerId);
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    }
);

const initialState = {
    plans: [],
    selectedPlan: null,
    currentSubscription: null,
    subscriptionHistory: [],
    isSubscriptionActive: false,
    loading: false,
    error: null,
    paymentDetails: null,
    success: false,
    message: ""
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
        },
        setSelectedPlan: (state, action) => {
            state.selectedPlan = action.payload;
        },
        resetState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
            state.message = "";
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
                state.error = action.payload;
            })
            
            // Fetch All Plans
            .addCase(fetchAllPlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllPlans.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = action.payload;
            })
            .addCase(fetchAllPlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch Plan By ID
            .addCase(fetchPlanById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlanById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedPlan = action.payload;
            })
            .addCase(fetchPlanById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Create Plan
            .addCase(createPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = "Subscription plan created successfully";
                state.plans.unshift(action.payload);
            })
            .addCase(createPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Update Plan
            .addCase(updatePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = "Subscription plan updated successfully";
                state.plans = state.plans.map(plan => 
                    plan.id === action.payload.id ? action.payload : plan
                );
                if (state.selectedPlan && state.selectedPlan.id === action.payload.id) {
                    state.selectedPlan = action.payload;
                }
            })
            .addCase(updatePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Delete Plan
            .addCase(deletePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = "Subscription plan deleted successfully";
                state.plans = state.plans.filter(plan => plan.id !== action.payload);
                if (state.selectedPlan && state.selectedPlan.id === action.payload) {
                    state.selectedPlan = null;
                }
            })
            .addCase(deletePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Toggle Plan Status
            .addCase(togglePlanStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(togglePlanStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = `Subscription plan ${action.payload.isActive ? 'activated' : 'deactivated'} successfully`;
                state.plans = state.plans.map(plan => 
                    plan.id === action.payload.id ? action.payload : plan
                );
                if (state.selectedPlan && state.selectedPlan.id === action.payload.id) {
                    state.selectedPlan = action.payload;
                }
            })
            .addCase(togglePlanStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Initiate Subscription
            .addCase(initiateSubscription.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(initiateSubscription.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSubscription = action.payload;
                state.success = true;
                state.message = "Subscription initiated successfully";
            })
            .addCase(initiateSubscription.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Initiate Payment
            .addCase(initiatePayment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(initiatePayment.fulfilled, (state, action) => {
                state.loading = false;
                state.paymentDetails = action.payload;
                state.success = true;
                state.message = "Payment initiated successfully";
            })
            .addCase(initiatePayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Verify Payment
            .addCase(verifyPayment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyPayment.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSubscription = action.payload;
                state.success = true;
                state.message = "Payment verified successfully";
                state.isSubscriptionActive = action.payload.status === "ACTIVE";
            })
            .addCase(verifyPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch Subscription
            .addCase(fetchSubscription.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSubscription.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSubscription = action.payload;
            })
            .addCase(fetchSubscription.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch Manager Subscription
            .addCase(fetchManagerSubscription.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchManagerSubscription.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSubscription = action.payload;
                state.isSubscriptionActive = true;
            })
            .addCase(fetchManagerSubscription.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                // Not setting isSubscriptionActive to false here as the error might be unrelated
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
                state.error = action.payload;
            })
            
            // Check Subscription Status
            .addCase(checkSubscriptionStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkSubscriptionStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.isSubscriptionActive = action.payload;
            })
            .addCase(checkSubscriptionStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isSubscriptionActive = false;
            });
    }
});

export const { clearError, setPaymentDetails, setSelectedPlan, resetState } = subscriptionSlice.actions;

// Selectors
export const selectSubscriptionPlans = (state) => state.subscription.plans;
export const selectSelectedPlan = (state) => state.subscription.selectedPlan;
export const selectSubscriptionLoading = (state) => state.subscription.loading;
export const selectSubscriptionError = (state) => state.subscription.error;
export const selectPaymentDetails = (state) => state.subscription.paymentDetails;
export const selectCurrentSubscription = (state) => state.subscription.currentSubscription;
export const selectSubscriptionHistory = (state) => state.subscription.subscriptionHistory;
export const selectIsSubscriptionActive = (state) => state.subscription.isSubscriptionActive;
export const selectSubscriptionSuccess = (state) => state.subscription.success;
export const selectSubscriptionMessage = (state) => state.subscription.message;

export default subscriptionSlice.reducer;