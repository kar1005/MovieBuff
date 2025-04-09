// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import { ToastContainer } from "react-toastify";

// Apps for different user roles
import CustomerApp from "./components/customer/CustomerApp";
import ManagerApp from "./components/theater/ManagerApp";
import AdminApp from "./components/admin/AdminApp";

// Common components
// import Index from "./components/customer/Home/Index";
import Authenticate from "./components/common/Authenticate/Authenticate";
import Register from "./components/common/Register/Register";

// Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./styles/main.css";
import Home from "./components/customer/Home/Home";

function App() {
  return (
    <Provider store={store}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"></link>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          {/* Common Authentication Routes */}
          <Route path="/login" element={<Authenticate />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminApp />} />
          
          {/* Theater Manager Routes */}
          <Route path="/manager/*" element={<ManagerApp />} />
          
          {/* Customer Routes */}
          <Route path="/customer/*" element={<CustomerApp />} />

          <Route path="/home" element={<Home />} />

          
          {/* Home Page and Default Redirect */}
          {/* <Route path="/" element={<Index />} /> */}
          {/* <Route path="*" element={<Navigate to="/customer" replace />} /> */}
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;