import React, { useState } from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';

const TheaterLayoutViewer = () => {
  // Sample data
  const sampleLayout = Array(8).fill(null).map((_, rowIndex) => 
    Array(12).fill(null).map((_, colIndex) => {
      // Add aisles
      if (colIndex === 3 || colIndex === 8) {
        return { type: 'AISLE' };
      }
      
      // Add exits on the sides of first and last rows
      if (rowIndex === 0 || rowIndex === 7) {
        if (colIndex === 0 || colIndex === 11) {
          return { type: 'EXIT' };
        }
      }
      
      // Add stairs at specific positions
      if ((rowIndex === 0 || rowIndex === 7) && (colIndex === 4 || colIndex === 7)) {
        return { type: 'STAIRS' };
      }

      // Define seat categories based on rows
      let category;
      if (rowIndex < 2) {
        category = 'PREMIUM';
      } else if (rowIndex < 5) {
        category = 'GOLD';
      } else {
        category = 'SILVER';
      }

      return { type: 'SEAT', category };
    })
  );

  const sampleData = {
    layout: sampleLayout,
    pricing: {
      PREMIUM: { finalPrice: 500 },
      GOLD: { finalPrice: 300 },
      SILVER: { finalPrice: 200 }
    }
  };

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [hoveredSeat, setHoveredSeat] = useState(null);

  const handleSeatClick = (row, col, category, status) => {
    if (status === 'BLOCKED' || status === 'BOOKED') return;
    
    const seatIndex = selectedSeats.findIndex(
      seat => seat.row === row && seat.column === col
    );
    
    if (seatIndex === -1) {
      setSelectedSeats([...selectedSeats, { row, column: col, category }]);
    } else {
      setSelectedSeats(selectedSeats.filter((_, index) => index !== seatIndex));
    }
  };

  const getSeatStatus = (row, col) => {
    const isSelected = selectedSeats.some(
      seat => seat.row === row && seat.column === col
    );
    
    // Add some sample booked seats
    if ((row === 2 && col === 5) || (row === 3 && col === 6) || (row === 4 && col === 4)) {
      return 'BOOKED';
    }
    
    return isSelected ? 'SELECTED' : 'AVAILABLE';
  };

  const getCellClass = (cell, row, col) => {
    const baseClass = 'd-flex align-items-center justify-content-center fs-6 transition rounded';
    
    if (cell.type === 'EMPTY') return `${baseClass} bg-light`;
    if (cell.type === 'AISLE') return `${baseClass} bg-info bg-opacity-25`;
    if (cell.type === 'STAIRS') return `${baseClass} bg-warning bg-opacity-25`;
    if (cell.type === 'EXIT') return `${baseClass} bg-danger text-white`;
    
    if (cell.type === 'SEAT') {
      const status = getSeatStatus(row, col);
      const categoryClasses = {
        PREMIUM: 'bg-purple text-white',
        GOLD: 'bg-warning text-dark',
        SILVER: 'bg-secondary text-white'
      };
      
      const statusClasses = {
        AVAILABLE: 'hover-scale',
        SELECTED: 'bg-success text-white border border-2 border-success',
        BLOCKED: 'bg-secondary bg-opacity-50 text-muted',
        BOOKED: 'bg-secondary bg-opacity-50 text-muted'
      };
      
      return `${baseClass} ${categoryClasses[cell.category]} ${statusClasses[status]} cursor-pointer`;
    }
    
    return baseClass;
  };

  const renderPriceTooltip = (category) => {
    if (!hoveredSeat || !sampleData.pricing) return null;
    
    const price = sampleData.pricing[category]?.finalPrice;
    if (!price) return null;

    return (
      <div className="position-absolute top-0 start-50 translate-middle-x bg-dark text-white px-2 py-1 rounded small" 
           style={{ marginTop: '-20px' }}>
        ₹{price}
      </div>
    );
  };

  return (
    <div className="m-4">
      <Card className="mx-auto" style={{ maxWidth: '1200px' }}>
        <Card.Body className="p-4">
          <Container fluid className="d-flex flex-column align-items-center gap-4">
            {/* Screen */}
            <div className="w-75 bg-light rounded p-3 text-center position-relative mb-5">
              <div className="d-flex align-items-center justify-content-center gap-2 text-muted">
                <i className="bi bi-display fs-5"></i>
                <span className="fw-semibold">Screen</span>
              </div>
              <div className="position-absolute bottom-0 start-50 translate-middle-x w-75" 
                   style={{ 
                     background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), transparent)',
                     height: '1rem',
                     transform: 'translateY(100%)'
                   }} />
            </div>

            {/* Layout Grid */}
            <div className="theater-layout overflow-auto w-100">
              <div className="d-inline-block">
                {sampleData.layout.map((row, rowIndex) => (
                  <div key={rowIndex} className="d-flex justify-content-center">
                    {/* Row Label */}
                    <div className="d-flex align-items-center justify-content-center me-2" 
                         style={{ width: '30px' }}>
                      <span className="text-muted fw-bold">{String.fromCharCode(65 + rowIndex)}</span>
                    </div>

                    {/* Seats */}
                    {row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="position-relative"
                        onMouseEnter={() => cell.type === 'SEAT' && setHoveredSeat({ row: rowIndex, col: colIndex })}
                        onMouseLeave={() => setHoveredSeat(null)}
                      >
                        <div
                          className={`${getCellClass(cell, rowIndex, colIndex)}`}
                          onClick={() => cell.type === 'SEAT' && handleSeatClick(rowIndex, colIndex, cell.category)}
                          style={{ width: '40px', height: '40px', margin: '2px' }}
                        >
                          {cell.type === 'EXIT' && 'EXIT'}
                          {cell.type === 'STAIRS' && '↑'}
                          {cell.type === 'SEAT' && `${colIndex + 1}`}
                        </div>
                        {cell.type === 'SEAT' && hoveredSeat?.row === rowIndex && hoveredSeat?.col === colIndex && 
                          renderPriceTooltip(cell.category)}
                      </div>
                    ))}

                    {/* Row Label (right side) */}
                    <div className="d-flex align-items-center justify-content-center ms-2" 
                         style={{ width: '30px' }}>
                      <span className="text-muted fw-bold">{String.fromCharCode(65 + rowIndex)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <Row className="w-100 border-top pt-4 mt-4 g-3">
              {[
                { label: 'Premium - ₹500', class: 'bg-purple' },
                { label: 'Gold - ₹300', class: 'bg-warning' },
                { label: 'Silver - ₹200', class: 'bg-secondary' },
                { label: 'Selected', class: 'bg-success' },
                { label: 'Booked', class: 'bg-secondary bg-opacity-50' },
                { label: 'Available', class: 'border border-2' }
              ].map(item => (
                <Col key={item.label} xs={6} md={4} className="d-flex align-items-center gap-2">
                  <div className={`${item.class} rounded`} style={{ width: '24px', height: '24px' }} />
                  <span className="small text-muted">{item.label}</span>
                </Col>
              ))}
            </Row>
          </Container>
        </Card.Body>
      </Card>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <Card className="mx-auto mt-4" style={{ maxWidth: '1200px' }}>
          <Card.Body>
            <h5 className="mb-3">Selected Seats</h5>
            <div className="d-flex flex-wrap gap-2">
              {selectedSeats.map((seat, index) => (
                <span key={index} className="badge bg-success">
                  {String.fromCharCode(65 + seat.row)}{seat.column + 1}
                </span>
              ))}
            </div>
            <div className="mt-3">
              <strong>Total Amount: </strong>
              ₹{selectedSeats.reduce((total, seat) => total + sampleData.pricing[seat.category].finalPrice, 0)}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default TheaterLayoutViewer;