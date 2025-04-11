// src/pages/theater/ScreenSetup.js
import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import ScreenConfiguration from "./ScreenConfiguration";
import ScreenDesign from "./ScreenDesign";

const ScreenSetup = () => {
  const { theaterId, screenId } = useParams();
  
  return (
    <Routes>
      <Route path="/" element={<ScreenConfiguration />} />
      <Route path="/design" element={<ScreenDesign />} />
    </Routes>
  );
};

export default ScreenSetup;