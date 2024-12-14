import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { Save, Eraser, RotateCcw, Check, Edit2, Trash2, Monitor } from 'lucide-react';
import '../../styles/TheaterLayout.css';

const TheaterLayoutDesigner = () => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [dimensions, setDimensions] = useState({ rows: 10, columns: 15 });
  const [selectedTool, setSelectedTool] = useState('SEAT');
  const [selectedCategory, setSelectedCategory] = useState('SILVER');
  const [grid, setGrid] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showLegend, setShowLegend] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const tools = [
    { id: 'SEAT', label: 'Seat', color: 'primary' },
    { id: 'AISLE', label: 'Aisle', color: 'info' },
    { id: 'STAIRS', label: 'Stairs', color: 'warning' },
    { id: 'EXIT', label: 'Exit', color: 'danger' },
    { id: 'GAP', label: 'Gap', color: 'secondary' },
    { id: 'ERASER', label: 'Eraser', color: 'dark' }
  ];

  const categories = [
    { id: 'PREMIUM', label: 'Premium', color: 'premium', price: '₹500' },
    { id: 'GOLD', label: 'Gold', color: 'gold', price: '₹300' },
    { id: 'SILVER', label: 'Silver', color: 'silver', price: '₹200' }
  ];

  useEffect(() => {
    initializeGrid();
  }, [dimensions.rows, dimensions.columns]);

  const initializeGrid = () => {
    const newGrid = Array(dimensions.rows).fill(null).map(() =>
      Array(dimensions.columns).fill(null).map(() => ({
        type: 'EMPTY',
        category: null
      }))
    );
    setGrid(newGrid);
    setHistory([newGrid]);
    setCurrentStep(0);
  };

  const handleCellClick = (row, col) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    if (selectedTool === 'ERASER') {
      newGrid[row][col] = { type: 'EMPTY', category: null };
    } else {
      newGrid[row][col] = {
        type: selectedTool,
        category: selectedTool === 'SEAT' ? selectedCategory : null
      };
    }
    setGrid(newGrid);
    addToHistory(newGrid);
  };

  const addToHistory = (newGrid) => {
    const newHistory = [...history.slice(0, currentStep + 1), newGrid];
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setGrid(history[currentStep - 1]);
    }
  };

  const handleRedo = () => {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
      setGrid(history[currentStep + 1]);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire layout?')) {
      initializeGrid();
    }
  };

  const handleSave = () => {
    setShowSuccess(true);
    setIsPreviewMode(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCommit = async () => {
    try {
      // API call to save the layout
      const layoutData = {
        dimensions,
        layout: grid,
        timestamp: new Date().toISOString()
      };
      console.log('Saving layout:', layoutData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const getCellClass = (cell) => {
    if (cell.type === 'EMPTY') return 'cell-empty';
    if (cell.type === 'SEAT') return `cell-seat ${cell.category.toLowerCase()}`;
    return `cell-${cell.type.toLowerCase()}`;
  };

  const getCellContent = (cell) => {
    if (cell.type === 'EXIT') return 'EXIT';
    if (cell.type === 'STAIRS') return '↑';
    return '';
  };

  const DesignerMode = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Theater Layout Designer</h2>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            onClick={handleUndo}
            disabled={currentStep === 0}
          >
            <RotateCcw size={16} className="me-1" />
            Undo
          </Button>
          <Button 
            variant="outline-secondary"
            onClick={handleRedo}
            disabled={currentStep === history.length - 1}
          >
            <RotateCcw size={16} className="me-1 rotate-180" />
            Redo
          </Button>
          <Button 
            variant="danger"
            onClick={handleClearAll}
          >
            <Trash2 size={16} className="me-1" />
            Clear
          </Button>
          <Button 
            variant="primary"
            onClick={handleSave}
          >
            <Save size={16} className="me-1" />
            Save & Preview
          </Button>
        </div>
      </div>

      <Row>
        <Col md={3}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Tools</h5>
              {tools.map(tool => (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? tool.color : 'outline-secondary'}
                  onClick={() => setSelectedTool(tool.id)}
                  className="w-100 mb-2"
                >
                  {tool.label}
                </Button>
              ))}

              {selectedTool === 'SEAT' && (
                <>
                  <h5 className="mt-4 mb-3">Seat Category</h5>
                  {categories.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'primary' : 'outline-secondary'}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-100 mb-2 category-${category.color.toLowerCase()}`}
                    >
                      {category.label}
                    </Button>
                  ))}
                </>
              )}

              <h5 className="mt-4 mb-3">Dimensions</h5>
              <Row className="g-2">
                <Col>
                  <Form.Control
                    type="number"
                    value={dimensions.rows}
                    onChange={(e) => setDimensions(prev => ({
                      ...prev,
                      rows: Math.max(1, parseInt(e.target.value) || 1)
                    }))}
                    min="1"
                  />
                </Col>
                <Col xs="auto" className="d-flex align-items-center">×</Col>
                <Col>
                  <Form.Control
                    type="number"
                    value={dimensions.columns}
                    onChange={(e) => setDimensions(prev => ({
                      ...prev,
                      columns: Math.max(1, parseInt(e.target.value) || 1)
                    }))}
                    min="1"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <Card>
            <Card.Body>
              <div className="theater-grid-container">
                <div className="theater-screen mb-4">
                  <Monitor size={20} />
                  <span>Screen</span>
                </div>
                <div className="theater-grid">
                  {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="d-flex">
                      {row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`grid-cell ${getCellClass(cell)}`}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          onMouseDown={() => setIsDrawing(true)}
                          onMouseEnter={() => isDrawing && handleCellClick(rowIndex, colIndex)}
                          onMouseUp={() => setIsDrawing(false)}
                        >
                          {getCellContent(cell)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  const PreviewMode = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Theater Layout Preview</h2>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={() => setIsPreviewMode(false)}
          >
            <Edit2 size={16} className="me-1" />
            Edit Layout
          </Button>
          <Button
            variant="primary"
            onClick={handleCommit}
          >
            <Check size={16} className="me-1" />
            Commit Changes
          </Button>
        </div>
      </div>

      <Card>
        <Card.Body>
          <div className="theater-preview">
            <div className="theater-screen mb-4">
              <Monitor size={20} />
              <span>Screen</span>
            </div>
            <div className="theater-grid preview-mode">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="d-flex">
                  {row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`grid-cell ${getCellClass(cell)}`}
                    >
                      {getCellContent(cell)}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {showLegend && (
              <div className="legend mt-4">
                <Row className="g-3">
                  {categories.map(category => (
                    <Col key={category.id} md={4}>
                      <div className="d-flex align-items-center gap-2">
                        <div className={`legend-box category-${category.color.toLowerCase()}`}></div>
                        <span>{category.label} ({category.price})</span>
                      </div>
                    </Col>
                  ))}
                  {[
                    { type: 'AISLE', label: 'Aisle' },
                    { type: 'STAIRS', label: 'Stairs' },
                    { type: 'EXIT', label: 'Exit' }
                  ].map(item => (
                    <Col key={item.type} md={4}>
                      <div className="d-flex align-items-center gap-2">
                        <div className={`legend-box cell-${item.type.toLowerCase()}`}></div>
                        <span>{item.label}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </>
  );

  return (
    <Container fluid className="p-4">
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          Layout saved successfully!
        </Alert>
      )}
      {isPreviewMode ? <PreviewMode /> : <DesignerMode />}
    </Container>
  );
};

export default TheaterLayoutDesigner;