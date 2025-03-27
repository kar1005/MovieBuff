import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container, Navbar, Nav, NavDropdown } from "react-bootstrap";
import { Provider } from "react-redux";
import store from "./redux/store";

//common components
import Layout from "./../src/components/Layout/Layout";
import Index from "./components/common/Home/Index";
import Authenticate from "./components/common/Authenticate/Authenticate";

// Theater Manager Components
import TheaterManagerHome from "./components/theater/TheaterManagerHome";
// import TheaterList from "./components/theater/TheaterList";
// import AddTheater from "./components/theater/AddTheater";
import TheaterEdit from "./components/theater/TheaterEdit";
import ScreenSetup from "./components/theater/ScreenSetup";
import ShowList from "./components/theater/ShowList";
import ShowSchedule from "./components/theater/ShowSchedule";
import Analytics from "./components/theater/Analytics";
import TheaterScreens from "./components/theater/TheaterScreens";
// import Login from "./../src/components/common/Login";
import Register from "./../src/components/common/Register/Register";
import AdminSidebar from "./../src/components/admin/Main/AdminSidebar";

// Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/main.css";
import TheaterSeatLayout from "./components/theater/TheaterSeatLayout";
import SubscriptionPlans from "./components/subscription/SubscriptionPlans";
import SubscriptionStatus from "./components/subscription/SubscriptionStatus";
import ManageSubscriptionPlans from "./components/admin/Subscription/ManageSubscriptionPlans";
import AdminLayout from "./components/admin/Main/AdminLayout";
import AdminApp from "./components/admin/Main/AdminApp";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <Provider store={store}>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"></link>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          {/* Theater Manager Routes */}
          <Route path="/manager" element={<TheaterManagerHome />} />
          {/* <Route path="/manager/theaters" element={<TheaterList />} /> */}
          {/* <Route path="/manager/theaters/add" element={<AddTheater />} /> */}
          {/* <Route path="/manager/theaters/:id" element={<TheaterEdit />} /> */}
          {/* <Route path="/manager/theaters/:theaterId/edit" element={<TheaterEdit />} /> */}
          <Route path="/manager/theater/edit" element={<TheaterEdit />} />

          <Route path="/viewScreen" element={<TheaterSeatLayout />} />
          {/* New Theater Screen Routes */}
          <Route
            path="/manager/theaters/:theaterId/screens"
            element={<TheaterScreens />}
          />
          <Route
            path="/manager/theaters/:theaterId/screens/:screenId/edit"
            element={<ScreenSetup />}
          />
          <Route
            path="/manager/theaters/:theaterId/screens/add"
            element={<ScreenSetup />}
          />

          <Route path="/manager/screen-setup" element={<ScreenSetup />} />
          <Route path="/manager/shows" element={<ShowList />} />
          <Route path="/manager/shows/schedule" element={<ShowSchedule />} />
          <Route path="/manager/analytics" element={<Analytics />} />

          <Route path="/login" element={<Authenticate />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="/admin" element={<AdminSidebar />} /> */}
          <Route
            path="/admin/subscription-plans"
            element={<ManageSubscriptionPlans />}
          />

          {/* Add routes for customer and admin interfaces */}

          {/*Razorpay */}
          <Route path="/manager/subscription" element={<SubscriptionPlans />} />
          <Route
            path="/manager/subscription/status"
            element={<SubscriptionStatus />}
          />
          <Route path="/admin/*" element={<AdminApp />} />

          {/* Default redirect */}
          <Route path="/" element={<Index />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
