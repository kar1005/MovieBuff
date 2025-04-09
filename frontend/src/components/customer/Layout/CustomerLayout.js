// src/components/customer/Layout/CustomerLayout.js
import React from 'react';
import Header from './../Header/Header';
import Footer from './../Footer/Footer';

const CustomerLayout = ({ children }) => {

  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
};

export default CustomerLayout;