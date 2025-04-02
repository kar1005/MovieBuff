// src/components/admin/AdminApp.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './Home/AdminLayout.js';
import Movies from './Movies/Movies.js';
import Customers from './Customers/Customers.js';
import TheaterManagers from './TheatreManager/TheatreManagers.js';
import AdminDashboard from './Home/AdminDashboard.js';
import Reviews from './Reviews/Review.js';
import ManageSubscriptionPlans from './Subscription/ManageSubscriptionPlans.js';
import AddMovie from './Movies/AddMovie.js';
import EditMovie from './Movies/EditMovie.js';
import ActorHome from './Actors/ActorHome.js';
import EditActor from './Actors/EditActor.js';
import AddActor from './Actors/AddActor.js';
import AddTheatreManager from './TheatreManager/AddTheatreManager.js';
import SliderManagement from './Slider/SliderManagement.js';

const AdminApp = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboard />} />

        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/add" element={<AddMovie />} />
        <Route path="/movies/edit/:id" element={<EditMovie />} />
        
        <Route path="/actors" element={<ActorHome />} />
        <Route path="/actors/add" element={<AddActor />} />
        <Route path="/actors/edit/:id" element={<EditActor />} />

        <Route path="/customers" element={<Customers />} />

        <Route path="/reviews" element={<Reviews />} />

        <Route path="/theater-managers" element={<TheaterManagers />} />
        <Route path="/theater-Add" element={<AddTheatreManager />} />

        <Route path="/subscription" element={<ManageSubscriptionPlans/>} />

        <Route path="/slider" element={<SliderManagement/>} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminApp;