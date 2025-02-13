import { createSlice } from "@reduxjs/toolkit";

const initialState ={
    token: localStorage.getItem('token'),
    email:null,
    id:null,
    isAuthenticated: false,
    loading: false,
    error: null,
    role:'GUEST',
}

const authSlice = createSlice({
    name:'auth',
    initialState,
    reducers:{
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
          },
          loginSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.email = action.payload.email;
            state.token = action.payload.token;
            state.role = action.payload.role;
            state.id = action.payload.id;
          },
          loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
          },
        logout:(state)=>{
            state.email = null;
            state.id=null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            state.role = 'GUEST';
        }
    }
});


export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;