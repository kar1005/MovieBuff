// src/components/theater/ManagerApp.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TheaterManagerLayout from './Layout/TheaterManagerLayout';

// Import theater manager-specific components
import TheaterManagerHome from './Home/TheaterManagerHome';
import TheaterEdit from './Home/TheaterEdit';
import ScreenSetup from './ScreenManagement/ScreenSetup';
import ShowList from './Shows/ShowList';
import Analytics from './Analytics/Analytics';
import TheaterScreens from './ScreenManagement/TheaterScreens';
import TheaterSeatLayout from './ScreenManagement/TheaterSeatLayout';
import SubscriptionPlans from './subscription/SubscriptionPlans';
import SubscriptionStatus from './subscription/SubscriptionStatus';
import AddShow from './Shows/AddShow';
import EditShow from './Shows/EditShow';

const ManagerApp = () => {
  return (
    <TheaterManagerLayout>
      <Routes>
        <Route path="/" element={<TheaterManagerHome />} />

        
        {/* Theater Management */}
        <Route path="/theater/edit" element={<TheaterEdit />} />
        
        {/* Screen Management */}
        <Route path="/theaters/:theaterId/screens" element={<TheaterScreens />} />
        <Route path="/theaters/:theaterId/screens/:screenId/edit/*" element={<ScreenSetup />} />
        <Route path="/theaters/:theaterId/screens/add/*" element={<ScreenSetup />} />
        {/* <Route path="/screen-setup" element={<ScreenSetup />} /> */}
        <Route path="/view-screen" element={<TheaterSeatLayout />} />
        
        {/* Show Management */}
        <Route path="/shows" element={<ShowList />} />
        <Route path="/shows/add" element={<AddShow />} />
        <Route path="/shows/edit/:showId" element={<EditShow />} />

        
        {/* Analytics */}
        <Route path="/analytics" element={<Analytics />} />
        
        {/* Subscription */}
        <Route path="/subscription" element={<SubscriptionPlans />} />
        <Route path="/subscription/status" element={<SubscriptionStatus />} />
      </Routes>
     </TheaterManagerLayout>
  );
};

export default ManagerApp;