import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Monitor } from 'lucide-react';

const TheaterPreview = ({ layoutData, onEdit, onCommit }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showLegend, setShowLegend] = useState(true);

  const categories = [
    { id: 'RECLINER', label: 'Recliner', price: '₹443.39', color: 'seat-recliner' },
    { id: 'PRIME_PLUS', label: 'Prime Plus', price: '₹249.41', color: 'seat-prime-plus' },
    { id: 'PRIME', label: 'Prime', price: '₹203.22', color: 'seat-prime' },
    { id: 'CLASSIC', label: 'Classic', price: '₹184.75', color: 'seat-classic' }
  ];

  const getCellClass = (cell) => {
    if (cell.type === 'EMPTY') return 'seat-empty';
    if (cell.type === 'SEAT') {
      const baseClass = `seat-cell ${cell.category.toLowerCase()}`;
      if (selectedSeats.some(s => s.row === cell.row && s.col === cell.col)) {
        return `${baseClass} selected`;
      }
      return baseClass;
    }
    if (cell.type === 'AISLE') return 'aisle';
    if (cell.type === 'STAIRS') return 'stairs';
    if (cell.type === 'EXIT') return 'exit';
    return '';
  };

  const handleSeatClick = (row, col, cell) => {
    if (cell.type !== 'SEAT' || cell.status === 'SOLD') return;
    
    const seatIndex = selectedSeats.findIndex(s => s.row === row && s.col === col);
    if (seatIndex > -1) {
      setSelectedSeats(selectedSeats.filter((_, index) => index !== seatIndex));
    } else {
      setSelectedSeats([...selectedSeats, { row, col, category: cell.category }]);
    }
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => {
      const category = categories.find(c => c.id === seat.category);
      return total + parseFloat(category.price.replace('₹', ''));
    }, 0);
  };

  return (
    <Container fluid className="py-4">
      <Card className="preview-container">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Select Your Seats</h4>
          <div>
            <Button variant="outline-primary" onClick={onEdit} className="me-2">
              Edit Layout
            </Button>
            <Button variant="primary" onClick={onCommit}>
              Commit Changes
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-5">
            <div className="screen-indicator">
              <Monitor size={24} className="me-2" />
              Screen
            </div>
          </div>

          <div className="theater-layout">
            {layoutData.map((row, rowIndex) => (
              <div key={rowIndex} className="d-flex justify-content-center">
                <div className="row-label">{String.fromCharCode(65 + rowIndex)}</div>
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClass({ ...cell, row: rowIndex, col: colIndex })}
                    onClick={() => handleSeatClick(rowIndex, colIndex, cell)}
                  >
                    {cell.type === 'SEAT' && colIndex + 1}
                    {cell.type === 'STAIRS' && '↑↓'}
                    {cell.type === 'EXIT' && 'EXIT'}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="seat-legend">
              <div className="d-flex justify-content-center gap-4">
                <div className="legend-item">
                  <div className="seat-cell">A1</div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="seat-cell selected">A1</div>
                  <span>Selected</span>
                </div>
                <div className="legend-item">
                  <div className="seat-cell sold">A1</div>
                  <span>Sold</span>
                </div>
                <div className="legend-item">
                  <div className="stairs">↑</div>
                  <span>Stairs</span>
                </div>
                <div className="legend-item">
                  <div className="exit">EXIT</div>
                  <span>Exit</span>
                </div>
              </div>
            </div>
          </div>

          {selectedSeats.length > 0 && (
            <div className="booking-summary mt-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  Selected Seats: {selectedSeats.map(seat => 
                    `${String.fromCharCode(65 + seat.row)}${seat.col + 1}`
                  ).join(', ')}
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="total-amount">
                    Total: ₹{calculateTotal().toFixed(2)}
                  </div>
                  <Button variant="dark">
                    Proceed to Payment
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TheaterPreview;