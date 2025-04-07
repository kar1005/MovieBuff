// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import adminSlice from "./slices/adminSlice";
import authSlice from "./slices/authSlice";
import bookingSlice from "./slices/bookingSlice";
import customerSlice from "./slices/customerSlice";
import movieSlice from "./slices/movieSlice";
import theaterSlice from "./slices/theaterSlice";
import subscriptionSlice from "./slices/subscriptionSlice";
import actorSlice from "./slices/actorSlice";
import userSlice from "./slices/userSlice";
import showSlice from "./slices/showSlice";
import couponSlice from "./slices/couponSlice";
import reviewSlice from "./slices/reviewSlice";
import locationReducer from "./slices/locationSlice";

const store = configureStore({
  reducer: {
    admin: adminSlice,
    auth: authSlice,
    booking: bookingSlice,
    customer: customerSlice,
    movies: movieSlice,
    theater: theaterSlice,
    subscription: subscriptionSlice,
    actors: actorSlice,
    users: userSlice,
    location: locationReducer,
    shows: showSlice,
    coupons: couponSlice,
    reviews: reviewSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export default store;