import React from 'react';

const Seat = ({ seat, isSelected, isReserved, onSelect }) => {
  const getSeatClass = () => {
    if (isReserved) return 'seat-reserved';
    if (isSelected) return 'seat-selected';
    if (seat.status === 'BOOKED') return 'seat-booked';
    return 'seat-available';
  };

  const handleClick = () => {
    if (seat.status !== 'BOOKED' && !isReserved) {
      onSelect(seat.id);
    }
  };

  return (
    <button
      className={`seat ${getSeatClass()}`}
      onClick={handleClick}
      disabled={seat.status === 'BOOKED' || isReserved}
      title={`Seat ${seat.row}${seat.number} - ${seat.category}`}
    >
      {seat.number}
    </button>
  );
};

export default Seat;