import React from 'react';
import { useParams } from 'react-router-dom';
import SeatBooking from './SeatBooking';

const Booking = () => {
  // Get showId from URL params
  const { showId } = useParams();

  return (
    <div className="booking-page">
      <h1>Select Your Seats</h1>
      <SeatBooking showId={showId} />
    </div>
  );
};

export default Booking;