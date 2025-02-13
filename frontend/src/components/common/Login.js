import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginStart,loginSuccess,loginFailure } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import {login} from './../../services/authServices'
import Header from '../shared/Header';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
      // Load Google's script if not already loaded
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        script.onload = () => {
          initializeGoogleButton();
        };
      } else {
        initializeGoogleButton();
      }
    }, []);

    useEffect(() => {
        // Initialize Google OAuth button for registration
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: "615283018778-esi1fv98n0ngpcanjmnh21q1sja5j3jh.apps.googleusercontent.com",
            callback: handleGoogleSuccess,
          });
    
          window.google.accounts.id.renderButton(
            document.getElementById('googleRegisterButton'),
            { theme: 'outline', size: 'large',width: '500px' }
          );
        }
      }, []);

      const initializeGoogleButton = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: "615283018778-mm2l8s4p01f5lkgvv3gmu792sdssi2g8.apps.googleusercontent.com", // Replace with your actual Google Client ID
            callback: handleGoogleSuccess,
            auto_select: false,
            cancel_on_tap_outside: true
          });
    
          window.google.accounts.id.renderButton(
            document.getElementById('googleButton'),
            { 
              theme: 'outline', 
              size: 'large',
              width: 280 // You can adjust this
            }
          );
        }
      };


      const handleGoogleSuccess = async (response) => {
        try {
          setLoading(true);
          const res = await fetch('http://localhost:8080/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',  // Add this
            body: JSON.stringify({ idToken: response.credential })
          });
      
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Google login failed');
          }
      
          const data = await res.json();  // Fixed this
      
          localStorage.setItem('token', data.token);
          dispatch(loginSuccess({
            email: data.user.email,  // Updated to use data.user
            token: data.token,
            role: data.role,
            id: data.user.id
          }));
          localStorage.setItem('token', data.token);
          console.log("email:",data.email);
          console.log("Role:",data.role);
          console.log("id:",data.id);
          alert('Login successful!');
          fnavigate(data.role);
        } catch (error) {
          console.log(error.message);
          dispatch(loginFailure(error.message));
        } finally {
          setLoading(false);
        }
      };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(loginStart());
      setLoading(true);
      const data = await login(credentials);
      localStorage.setItem('token', data.token);
      console.log("email:",data.email);
      console.log("Role:",data.role);
      console.log("id:",data.id);
      dispatch(loginSuccess({email: data.email, token: data.token,role:data.role,id:data.id}));
      alert('Login successful!');
      fnavigate(data.role);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      dispatch(loginFailure(error.message));
    } finally {
      setLoading(false);
    }
  };

  const fnavigate = (role)=>{
    if(role=="CUSTOMER")
      navigate('/');
    else if(role=="ADMIN")
      navigate('/admin');
    else if(role=="THEATER_MANAGER")
      navigate('/manager');
  };


  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {/* Google Sign In Button */}
        <div id="googleButton" className="flex justify-center"></div>

        <div className="mt-8 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;