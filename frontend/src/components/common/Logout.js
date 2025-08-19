import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { resetState } from "../../redux/slices/subscriptionSlice";
// Don't import resetState from other slices if they don't export it
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import authService from "../../services/authServices";

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const performLogout = async () => {
      if (!isMounted) return;

      try {
        console.log("msg form logout here");

        // Clear all localStorage items
        localStorage.clear(); // This clears ALL localStorage items at once

        // Call the backend logout endpoint
        await authService.logout();

        // Only proceed if component is still mounted
        if (isMounted) {
          // Clear Redux states (only the ones that have resetState exported)
          dispatch(logout()); // Auth state
          dispatch(resetState()); // Subscription state (this one exists)

          // Show a success message
          toast.success("You have been successfully logged out");

          // Redirect to the login page
          navigate("/login");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Logout error:", error);

          // Even on error, clear states
          dispatch(logout());
          dispatch(resetState());

          toast.error(
            "Logout encountered an error, but you have been logged out locally"
          );
          navigate("/login");
        }
      }
    };

    performLogout();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [dispatch, navigate]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4>Logging out...</h4>
      </div>
    </div>
  );
};

export default Logout;
