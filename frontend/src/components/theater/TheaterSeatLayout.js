// TheaterSeatLayout.js
import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { Monitor, Armchair, DoorOpen } from 'lucide-react';
import PropTypes from 'prop-types';
import '../../styles/TheaterSeatLayout.css';

// Sample static data matching the format
const sampleScreenData = {
  screenNumber: 1,
  screenName: "IMAX 1",
  layout: {
    totalRows: 13,
    totalColumns: 11,
    sections: [
      {
        category: "SILVER",
        basePrice: 200.0,
        rows: [
          { rowNumber: 3, startColumn: 2, endColumn: 10 },
          { rowNumber: 4, startColumn: 2, endColumn: 10 }
        ],
        color: "silver"
      },
      {
        category: "GOLD",
        basePrice: 300.0,
        rows: [
          { rowNumber: 5, startColumn: 2, endColumn: 10 },
          { rowNumber: 6, startColumn: 2, endColumn: 10 },
          { rowNumber: 7, startColumn: 2, endColumn: 10 }
        ],
        color: "gold"
      },
      {
        category: "PREMIUM",
        basePrice: 500.0,
        rows: [
          { rowNumber: 11, startColumn: 0, endColumn: 10 },
          { rowNumber: 12, startColumn: 0, endColumn: 10 }
        ],
        color: "premium"
      }
    ],
    stairs: [
      { location: { row: 3, column: 0 } },
      { location: { row: 3, column: 6 } },
      { location: { row: 6, column: 0 } }
    ],
    exits: [
      {
        gateNumber: "E1",
        location: { row: 0, column: 8 },
        type: "EMERGENCY"
      },
      {
        gateNumber: "E2",
        location: { row: 0, column: 9 },
        type: "EMERGENCY"
      }
    ],
    seatGaps: [
      { row: 7, column: 0 },
      { row: 7, column: 1 },
      { row: 10, column: 5 }
    ]
  }
};

const TheaterSeatLayout = ({ onSeatSelect }) => {
  const { layout } = sampleScreenData;
  const { totalRows, totalColumns, sections, stairs, exits, seatGaps } = layout;

  const isSeatGap = (row, col) => {
    return seatGaps.some(gap => gap.row === row && gap.column === col);
  };

  const isStairs = (row, col) => {
    return stairs.some(stair => stair.location.row === row && stair.location.column === col);
  };

  const isExit = (row, col) => {
    return exits.some(exit => exit.location.row === row && exit.location.column === col);
  };

  const getSeatCategory = (row, col) => {
    for (const section of sections) {
      const matchingRow = section.rows.find(
        r => r.rowNumber === row && col >= r.startColumn && col <= r.endColumn
      );
      if (matchingRow) {
        return section.category.toLowerCase();
      }
    }
    return null;
  };

  const renderCell = (row, col) => {
    if (isExit(row, col)) {
      return (
        <div className="seat-cell exit-cell">
          <DoorOpen size={20} />
          <span className="exit-text">EXIT</span>
        </div>
      );
    }

    if (isStairs(row, col)) {
      return (
        <div className="seat-cell stairs-cell">
          ↑
        </div>
      );
    }

    if (isSeatGap(row, col)) {
      return <div className="seat-cell gap-cell" />;
    }

    const category = getSeatCategory(row, col);
    if (category) {
      return (
        <div 
          className={`seat-cell seat-available ${category}`}
          onClick={() => onSeatSelect({ row, col, category })}
        >
          <Armchair size={20} />
        </div>
      );
    }

    return <div className="seat-cell" />;
  };

  return (
    <Container fluid className="theater-layout-container">
      <Card>
        <Card.Body>
          <div className="screen-container">
            <Monitor size={24} />
            <span>Screen</span>
          </div>
          
          <div className="seats-container">
            {Array.from({ length: totalRows }).map((_, rowIndex) => (
              <div key={rowIndex} className="seat-row">
                <div className="row-label">{String.fromCharCode(65 + rowIndex)}</div>
                {Array.from({ length: totalColumns }).map((_, colIndex) => (
                  <div key={colIndex} className="seat-wrapper">
                    {renderCell(rowIndex, colIndex)}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="layout-legend">
            <Row>
              {sections.map(section => (
                <Col key={section.category} xs={12} sm={4} className="legend-item">
                  <div className={`legend-box ${section.category.toLowerCase()}`}>
                    <Armchair size={16} />
                  </div>
                  <span>{section.category} - ₹{section.basePrice}</span>
                </Col>
              ))}
              <Col xs={12} sm={4} className="legend-item">
                <div className="legend-box stairs-cell">
                  ↑
                </div>
                <span>Stairs</span>
              </Col>
              <Col xs={12} sm={4} className="legend-item">
                <div className="legend-box exit-cell">
                  <DoorOpen size={16} />
                </div>
                <span>Exit</span>
              </Col>
            </Row>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

TheaterSeatLayout.propTypes = {
  onSeatSelect: PropTypes.func.isRequired
};

export default TheaterSeatLayout;