// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import theaterSlice from './slices/theaterSlice';
import authSlice from './slices/authSlice';
import adminSlice from './slices/adminSlice';
import customerSlice from './slices/customerSlice';

const store = configureStore({
  reducer: {
    theater: theaterSlice,
    auth: authSlice,
    admin: adminSlice,
    customer: customerSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;