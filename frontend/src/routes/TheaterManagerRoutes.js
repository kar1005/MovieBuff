// src/routes/TheaterManagerRoutes.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import TheaterManagerLayout from "../layouts/TheaterManagerLayout";
import TheaterManagerHome from "../pages/theater/TheaterManagerHome";
import AddTheater from "../pages/theater/AddTheater";
import ScreenSetup from "../components/theater/ScreenSetup";
import ShowSchedule from "../components/theater/ShowSchedule";
import Analytics from "../components/theater/Analytics";
import TheaterList from "../components/theater/TheaterList";
import TheaterEdit from "../components/theater/TheaterEdit";
import ShowList from "../components/theater/ShowList";

const TheaterManagerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<TheaterManagerLayout />}>
        <Route index element={<TheaterManagerHome />} />
        <Route path="add-theater" element={<AddTheater />} />
        <Route path="screen-setup" element={<ScreenSetup />} />
        <Route path="schedule" element={<ShowSchedule />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="theaters" element={<TheaterList />} />
        <Route path="theaters/:id" element={<TheaterEdit />} />
        <Route path="shows" element={<ShowList />} />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Route>
    </Routes>
  );
};

export default TheaterManagerRoutes;
