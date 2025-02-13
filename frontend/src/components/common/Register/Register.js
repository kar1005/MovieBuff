import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../../services/authServices';
import { Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { GOOGLE_CLIENT_ID } from '../../../config/googleAuth';
import GoogleAuthButton from '../GoogleAuthButton';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'CUSTOMER',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: [0, 0],
    }
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const initializeGoogleButton = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: "615283018778-mm2l8s4p01f5lkgvv3gmu792sdssi2g8.apps.googleusercontent.com", // Replace with your actual Google Client ID
        callback: handleGoogleSuccess,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleRegisterButton'),
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
      const result = await fetch('http://localhost:8080/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: response.credential
        })
      });

      if (!result.ok) {
        const errorData = await result.text();
        throw new Error(errorData);
      }

      const data = await result.json();
      navigate('/login');
      toast.success('Google registration successful! Please log in.');
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err.message || 'Google registration failed');
    }
  };

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



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const registrationData = { ...formData };
      delete registrationData.confirmPassword;
      await register(registrationData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

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

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-xl">
        <Card.Header>
          <h2 className="text-center text-3xl font-bold text-gray-900">Create an Account</h2>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {/* Add Google Sign Up Button */}
          <div id="googleRegisterButton" className="w-full flex justify-center mt-4"></div>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or register with email</span>
            </div>
          </div>
        </Card.Header>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="username">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter username"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm password"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="phoneNumber">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="street">
                    Street Address
                  </label>
                  <input
                    id="street"
                    type="text"
                    name="address.street"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter street address"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    name="address.city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="state">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    name="address.state"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter state"
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="zipCode">
                    ZIP Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    name="address.zipCode"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ZIP code"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Account
            </button>
          </form>
        </Card.Body>
      </div>
      </Card>
    </div>
  );
};

export default Register;