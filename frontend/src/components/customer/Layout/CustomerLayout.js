// src/components/customer/Layout/CustomerLayout.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import './CustomerLayout.css';

const CustomerLayout = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Comment this out during development if you don't want to be redirected
    // or enable a dev mode flag in your env
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="customer-layout">
      <Header />
      
      <main className="customer-main">
        {children}
      </main>

      <Footer />
    </div>
  )
};

export default CustomerLayout;