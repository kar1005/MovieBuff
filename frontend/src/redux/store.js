// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import adminSlice from "./slices/adminSlice";
import authSlice from "./slices/authSlice";
// import bookingSlice from "./slices/bookingSlice";
import customerSlice from "./slices/customerSlice";
// import movieSlice from "./slices/movieSlice";
import theaterSlice from "./slices/theaterSlice";
import subscriptionReducer from "./slices/subscriptionSlice";
import actorReducer from "./slices/actorSlice";
import userReducer from "./slices/userSlice";
const store = configureStore({
  reducer: {
    theater: theaterSlice,
    auth: authSlice,
    admin: adminSlice,
    subscription: subscriptionReducer,
    customer: customerSlice,
    actors: actorReducer,
    users: userReducer
    // booking: bookingSlice,
    // movie: movieSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export default store;
