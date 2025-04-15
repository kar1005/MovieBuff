import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authServices';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
  
    const performLogout = async () => {
      if (!isMounted) return;
      
      try {
        console.log('msg form logout here');
        
        // Clear all localStorage items
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('currentTheater');
        localStorage.removeItem('selectedTheaterId');
        
        // Call the backend logout endpoint
        await authService.logout();
        
        // Only proceed if component is still mounted
        if (isMounted) {
          // Dispatch the logout action to reset the Redux state
          dispatch(logout());
          
          // Show a success message
          toast.success('You have been successfully logged out');
          
          // Redirect to the login page
          navigate('/login');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Logout error:', error);
          dispatch(logout());
          toast.error('Logout encountered an error, but you have been logged out locally');
          navigate('/login');
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
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
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