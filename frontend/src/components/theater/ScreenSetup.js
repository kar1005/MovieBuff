// src/pages/theater/ScreenSetup.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Monitor, Save, Eraser, RotateCcw, Plus, X } from 'lucide-react';
import { addScreen, fetchTheaterById, updateScreen } from '../../redux/slices/theaterSlice';
import '../../styles/ScreenSetup.css';

const ScreenSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theaterId: urlTheaterId, screenId } = useParams();
  
  // Get theaterId either from URL or state
  const theaterId = urlTheaterId || location.state?.theaterId;
  
  const currentTheater = useSelector(state => state.theater.currentTheater);
  const loading = useSelector(state => state.theater.loading);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const tools = [
    { id: 'SEAT', label: 'Seat', color: 'primary' },
    { id: 'AISLE', label: 'Aisle', color: 'info' },
    { id: 'STAIRS', label: 'Stairs', color: 'warning' },
    { id: 'EXIT', label: 'Exit', color: 'danger' },
    { id: 'GAP', label: 'Gap', color: 'secondary' },
    { id: 'ERASER', label: 'Eraser', color: 'dark' }
  ];

  // State for custom categories
  const [categories, setCategories] = useState([
    { id: 'CATEGORY_1', label: 'Premium Plus', type: 'PREMIUM', color: 'premium', basePrice: 500 },
    { id: 'CATEGORY_2', label: 'Executive', type: 'GOLD', color: 'gold', basePrice: 300 },
    { id: 'CATEGORY_3', label: 'Normal', type: 'SILVER', color: 'silver', basePrice: 200 }
  ]);

  const [newCategory, setNewCategory] = useState({
    label: '',
    type: 'PREMIUM',
    basePrice: 0
  });

  const categoryTypes = [
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'GOLD', label: 'Gold' },
    { value: 'SILVER', label: 'Silver' }
  ];

  const seatTypes = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'RECLINER', label: 'Recliner' },
    { value: 'WHEELCHAIR', label: 'Wheelchair' },
    { value: 'COMPANION', label: 'Companion' },
    { value: 'VIP', label: 'VIP' }
  ];

  const experiences = [
    { value: '2D', label: '2D' },
    { value: '3D', label: '3D' },
    { value: 'IMAX', label: 'IMAX' },
    { value: '4DX', label: '4DX' },
    { value: 'Dolby', label: 'Dolby Cinema' }
  ];

  // Grid state
  const [dimensions, setDimensions] = useState({ rows: 10, columns: 15 });
  const [selectedTool, setSelectedTool] = useState('SEAT');
  const [selectedCategory, setSelectedCategory] = useState('CATEGORY_1');
  const [selectedSeatType, setSelectedSeatType] = useState('REGULAR');
  const [grid, setGrid] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Screen configuration state
  const [screenConfig, setScreenConfig] = useState({
    screenNumber: '',
    screenName: '',
    supportedExperiences: [],
    screenFeatures: {
      screenWidth: 0,
      screenHeight: 0,
      projectorType: '',
      soundSystem: ''
    },
    totalSeats: 0
  });
  console.log("----------------------------------------------------------------");
  console.log("theaterId : "+theaterId);
  console.log("----------------------------------------------------------------");

  
  // Fetch theater data
  useEffect(() => {
    if (theaterId) {
      dispatch(fetchTheaterById(theaterId));
    }
  }, [dispatch, theaterId]);

  // Initialize or fetch screen data
  useEffect(() => {
    if (currentTheater) {
      console.log("----------------------------------------------------------------------------");      
      console.log("screenId" + screenId);
      console.log("----------------------------------------------------------------------------");

      if (screenId) {
        const existingScreen = currentTheater.screens?.find(
          screen => screen.screenNumber === parseInt(screenId)
        );
        if (existingScreen) {
          console.log("----------------------------------------------------------------------------");      
          console.log("screenFeatures : " + existingScreen.screenFeatures);
          console.log("----------------------------------------------------------------------------");
    
          initializeExistingScreen(existingScreen);
        }
      } else {
        initializeGrid();
      }
    }
  }, [currentTheater, screenId]);


  // Inside the ScreenSetup component
  useEffect(() => {
    if (theaterId && screenId) {
      dispatch(fetchTheaterById(theaterId)).unwrap()
        .then(theater => {
          const screen = theater.screens.find(s => s.screenNumber === parseInt(screenId));
          console.log(screen);
          
          if (screen) {
            // Update screen configuration
            setScreenConfig({
              screenNumber: screen.screenNumber,
              screenName: screen.screenName,
              supportedExperiences: screen.supportedExperiences || [],
              screenFeatures: {
                screenWidth: screen.features?.screenWidth || 0,
                screenHeight: screen.features?.screenHeight || 0,
                projectorType: screen.features?.projectorType || '',
                soundSystem: screen.features?.soundSystem || ''
              },
              totalSeats: screen.totalSeats || 0
            });
  
            // Set categories from layout sections
            if (screen.layout?.sections) {
              const existingCategories = screen.layout.sections.map((section, idx) => ({
                id: `CATEGORY_${idx + 1}`,
                label: section.categoryName,
                type: section.categoryType,
                color: section.categoryType.toLowerCase(),
                basePrice: section.basePrice
              }));
              setCategories(existingCategories);
              if (existingCategories.length > 0) {
                setSelectedCategory(existingCategories[0].id);
              }
            }
  
            // Initialize grid with layout
            if (screen.layout) {
              setupGridFromLayout(screen.layout);
            }
          }
        })
        .catch(error => setError(error.message || 'Failed to fetch screen details'));
    } else {
      initializeGrid();
    }
  }, [dispatch, theaterId, screenId]);


  // Initialize grid for new screen
  const initializeGrid = () => {
    const newGrid = Array(dimensions.rows).fill(null).map(() =>
      Array(dimensions.columns).fill(null).map(() => ({
        type: 'EMPTY',
        category: null,
        seatType: null,
        seatNumber: null,
        isActive: true
      }))
    );
    setGrid(newGrid);
    setHistory([newGrid]);
    setCurrentStep(0);
  };

  // Initialize existing screen data
  const initializeExistingScreen = (screen) => {
    setScreenConfig({
      screenNumber: screen.screenNumber,
      screenName: screen.screenName,
      supportedExperiences: screen.supportedExperiences || [],
      screenFeatures: {
        screenWidth: screen.screenFeatures?.screenWidth || 0,
        screenHeight: screen.screenFeatures?.screenHeight || 0,
        projectorType: screen.screenFeatures?.projectorType || '',
        soundSystem: screen.screenFeatures?.soundSystem || ''
      },
      totalSeats: screen.totalSeats || 0
    });

    // Initialize categories from existing sections
    if (screen.layout?.sections) {
      const existingCategories = screen.layout.sections.map((section, index) => ({
        id: `CATEGORY_${index + 1}`,
        label: section.categoryName,
        type: section.categoryType,
        color: section.categoryType.toLowerCase(),
        basePrice: section.basePrice
      }));
      setCategories(existingCategories);
    }

    setupGridFromLayout(screen.layout);
  };

  // Setup grid from existing layout
  const setupGridFromLayout = (layout) => {
    if (!layout?.totalRows || !layout?.totalColumns) return;
  
    const newGrid = Array(layout.totalRows).fill(null).map(() =>
      Array(layout.totalColumns).fill(null).map(() => ({
        type: 'EMPTY',
        category: null,
        seatType: null,
        seatNumber: null,
        isActive: true
      }))
    );
  
    // Map sections and seats
    layout.sections?.forEach(section => {
      const category = categories.find(cat => 
        cat.label === section.categoryName && 
        cat.type === section.categoryType
      );
  
      section.seats?.forEach(seat => {
        const row = seat.row - 1;
        const col = seat.column - 1;
        
        if (row >= 0 && row < layout.totalRows && 
            col >= 0 && col < layout.totalColumns) {
          newGrid[row][col] = {
            type: 'SEAT',
            category: category?.id,
            seatType: seat.type || 'REGULAR',
            seatNumber: seat.seatNumber,
            isActive: seat.isActive
          };
        }
      });
    });
  
    // Map other elements
    layout.aisles?.forEach(aisle => {
      const row = aisle.position - 1;
      for (let col = aisle.startPosition - 1; col < aisle.endPosition; col++) {
        if (row >= 0 && row < layout.totalRows && 
            col >= 0 && col < layout.totalColumns) {
          newGrid[row][col] = { type: 'AISLE', category: null };
        }
      }
    });
  
    layout.stairs?.forEach(stair => {
      const row = stair.row - 1;
      const col = stair.column - 1;
      if (row >= 0 && row < layout.totalRows && 
          col >= 0 && col < layout.totalColumns) {
        newGrid[row][col] = { type: 'STAIRS', category: null };
      }
    });
  
    layout.exits?.forEach(exit => {
      const row = exit.row - 1;
      const col = exit.column - 1;
      if (row >= 0 && row < layout.totalRows && 
          col >= 0 && col < layout.totalColumns) {
        newGrid[row][col] = { type: 'EXIT', category: null };
      }
    });
  
    layout.seatGaps?.forEach(gap => {
      const row = gap.row - 1;
      const col = gap.column - 1;
      if (row >= 0 && row < layout.totalRows && 
          col >= 0 && col < layout.totalColumns) {
        newGrid[row][col] = { type: 'GAP', category: null };
      }
    });
  
    setDimensions({
      rows: layout.totalRows,
      columns: layout.totalColumns
    });
  
    setGrid(newGrid);
    setHistory([newGrid]);
    setCurrentStep(0);
  };

  const handleRemoveCategory = (categoryId) => {
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    
    if (selectedCategory === categoryId) {
      setSelectedCategory(updatedCategories[0]?.id || null);
    }
    
    // Update grid to remove seats with deleted category
    const updatedGrid = grid.map(row =>
      row.map(cell => {
        if (cell.type === 'SEAT' && cell.category === categoryId) {
          return {
            type: 'EMPTY',
            category: null,
            seatType: null,
            seatNumber: null,
            isActive: true
          };
        }
        return cell;
      })
    );
    
    setGrid(updatedGrid);
    addToHistory(updatedGrid);
  };
  
  const handleAddCategory = () => {
    if (!newCategory.label || newCategory.basePrice <= 0) {
      setError('Please provide a category name and valid price');
      return;
    }
  
    const categoryExists = categories.some(
      cat => cat.label.toLowerCase() === newCategory.label.toLowerCase()
    );
  
    if (categoryExists) {
      setError('A category with this name already exists');
      return;
    }
  
    const categoryId = `CATEGORY_${categories.length + 1}`;
    const updatedCategories = [...categories, {
      id: categoryId,
      ...newCategory,
      color: newCategory.type.toLowerCase()
    }];
    
    setCategories(updatedCategories);
    setNewCategory({ label: '', type: 'PREMIUM', basePrice: 0 });
    setError('');
  };
  

  // Grid cell click handler
  const handleCellClick = (row, col) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    if (selectedTool === 'ERASER') {
      newGrid[row][col] = { 
        type: 'EMPTY', 
        category: null, 
        seatType: null, 
        seatNumber: null, 
        isActive: true 
      };
    } else if (selectedTool === 'SEAT') {
      const category = categories.find(c => c.id === selectedCategory);
      newGrid[row][col] = {
        type: 'SEAT',
        category: selectedCategory,
        seatType: selectedSeatType,
        seatNumber: `${String.fromCharCode(65 + row)}${col + 1}`,
        isActive: true
      };
    } else {
      newGrid[row][col] = {
        type: selectedTool,
        category: null,
        seatType: null,
        seatNumber: null,
        isActive: true
      };
    }
    setGrid(newGrid);
    addToHistory(newGrid);
  };

  // History management
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

  // Create layout data for saving
  const createLayoutData = () => {
    const sections = categories.map(category => ({
      categoryName: category.label,
      categoryType: category.type,
      basePrice: category.basePrice,
      color: category.color,
      seats: []
    }));

    const layoutData = {
      totalRows: dimensions.rows,
      totalColumns: dimensions.columns,
      sections: [],
      aisles: [],
      stairs: [],
      exits: [],
      seatGaps: []
    };

    let totalSeats = 0;

    // Process grid cells
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.type === 'SEAT') {
          const section = sections.find(s => s.categoryName === 
            categories.find(c => c.id === cell.category)?.label
          );
          if (section) {
            section.seats.push({
              row: rowIndex + 1,
              column: colIndex + 1,
              seatNumber: cell.seatNumber,
              type: cell.seatType,
              isActive: cell.isActive
            });
            totalSeats++;
          }
        } else if (cell.type === 'AISLE') {
          layoutData.aisles.push({
            type: 'VERTICAL',
            position: colIndex + 1,
            startPosition: rowIndex + 1,
            endPosition: rowIndex + 1,
            width: 1
          });
        } else if (cell.type === 'STAIRS') {
          layoutData.stairs.push({
            type: 'ENTRY',
            location: { row: rowIndex + 1, column: colIndex + 1 },
            width: 1,
            direction: 'CENTER'
          });
        } else if (cell.type === 'EXIT') {
          layoutData.exits.push({
            gateNumber: `E${layoutData.exits.length + 1}`,
            location: { row: rowIndex + 1, column: colIndex + 1 },
            type: 'EMERGENCY',
            width: 1
          });
        } else if (cell.type === 'GAP') {
          layoutData.seatGaps.push({
            row: rowIndex + 1,
            column: colIndex + 1,
            width: 1
          });
        }
      });
    });

    // Add non-empty sections to layout
    layoutData.sections = sections.filter(section => section.seats.length > 0);
    
    return { layoutData, totalSeats };
  };

  // Form submission handler
  const handleSubmit = async () => {
    if (!screenConfig.screenName || !screenConfig.screenNumber) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate screen number
    // Validate screen number
    if (currentTheater?.screens?.some(screen => 
      screen.screenNumber === parseInt(screenConfig.screenNumber) && 
      (!screenId || screen.screenNumber !== parseInt(screenId))
    )) {
      setError('This screen number already exists in this theater');
      return;
    }

    setLocalLoading(true);
    setError('');

    try {
      const { layoutData, totalSeats } = createLayoutData();
      console.log('---------------------------------------------------');
      console.log("onSubmit : "+screenConfig.screenFeatures.projectorType);
      console.log('---------------------------------------------------');
      const screenData = {
        ...screenConfig,
        layout: layoutData,
        totalSeats
      };
      console.log('---------------------------------------------------');
      console.log("SD : "+screenData.screenFeatures);
      console.log('---------------------------------------------------');      
      
      if (screenId) {
        await dispatch(updateScreen({ theaterId, screenId, data: screenData })).unwrap();
      } else {
        await dispatch(addScreen({ theaterId, data: screenData })).unwrap();
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/manager/theaters/${theaterId}/screens`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error saving screen configuration');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/manager/theaters/${theaterId}/screens`);
  };

  // If theaterId is not available, redirect or show error
  if (!theaterId) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          Theater ID is required. Please select a theater first.
        </Alert>
      </Container>
    );
  }

  const gridStyles = {
    cell: {
      width: '40px',
      height: '40px',
      border: '1px solid #dee2e6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      margin: '1px',
    },
    premium: { backgroundColor: '#9333ea', color: 'white' },
    gold: { backgroundColor: '#fbbf24', color: 'black' },
    silver: { backgroundColor: '#9ca3af', color: 'white' },
    aisle: { backgroundColor: '#e2e8f0' },
    stairs: { backgroundColor: '#fde68a' },
    exit: { backgroundColor: '#ef4444', color: 'white' },
    gap: { backgroundColor: '#f3f4f6' },
    empty: { backgroundColor: '#ffffff' }
  };

  return (
    <Container fluid className="py-4">
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          Screen configuration saved successfully! Redirecting...
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row>
        <Col md={4} lg={3}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Screen Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Screen Name*</Form.Label>
                  <Form.Control
                    type="text"
                    value={screenConfig.screenName}
                    onChange={(e) => setScreenConfig(prev => ({
                      ...prev,
                      screenName: e.target.value
                    }))}
                    placeholder="e.g., IMAX Screen 1"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Screen Number*</Form.Label>
                  <Form.Control
                    type="number"
                    value={screenConfig.screenNumber}
                    onChange={(e) => setScreenConfig(prev => ({
                      ...prev,
                      screenNumber: parseInt(e.target.value)
                    }))}
                    min="1"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Supported Experiences</Form.Label>
                  {experiences.map(exp => (
                    <Form.Check
                      key={exp.value}
                      type="checkbox"
                      label={exp.label}
                      checked={screenConfig.supportedExperiences.includes(exp.value)}
                      onChange={() => {
                        setScreenConfig(prev => ({
                          ...prev,
                          supportedExperiences: prev.supportedExperiences.includes(exp.value)
                            ? prev.supportedExperiences.filter(e => e !== exp.value)
                            : [...prev.supportedExperiences, exp.value]
                        }));
                      }}
                    />
                  ))}
                </Form.Group>

                <h6 className="mt-4 mb-3">Screen Features</h6>
                <Row className="mb-3">
                  <Col>
                    <Form.Control
                      type="number"
                      placeholder="Width (m)"
                      value={screenConfig.screenFeatures.screenWidth}
                      onChange={(e) => setScreenConfig(prev => ({
                        ...prev,
                        screenFeatures: {
                          ...prev.screenFeatures,
                          screenWidth: parseFloat(e.target.value) || 0
                        }
                      }))}
                      required
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="number"
                      placeholder="Height (m)"
                      value={screenConfig.screenFeatures.screenHeight}
                      onChange={(e) => setScreenConfig(prev => ({
                        ...prev,
                        screenFeatures: {
                          ...prev.screenFeatures,
                          screenHeight: parseFloat(e.target.value) || 0
                        }
                      }))}
                      required
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Projector Type</Form.Label>
                  <Form.Control
                    type="text"
                    value={screenConfig.screenFeatures.projectorType}
                    onChange={(e) => setScreenConfig(prev => ({
                      ...prev,
                      screenFeatures: {
                        ...prev.screenFeatures,
                        projectorType: e.target.value
                      }
                    }))}
                    placeholder="e.g., Laser 4K"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Sound System</Form.Label>
                  <Form.Control
                    type="text"
                    value={screenConfig.screenFeatures.soundSystem}
                    onChange={(e) => setScreenConfig(prev => ({
                      ...prev,
                      screenFeatures: {
                        ...prev.screenFeatures,
                        soundSystem: e.target.value
                      }
                    }))}
                    placeholder="e.g., Dolby Atmos"
                  />
                </Form.Group>

                <h6 className="mt-4 mb-3">Category Management</h6>
                <div className="mb-3">
                  {categories.map(category => (
                    <div key={category.id} className="d-flex align-items-center mb-2">
                      <Badge bg={category.color} className="me-2">{category.label}</Badge>
                      <small className="text-muted me-2">₹{category.basePrice}</small>
                      <Button
                        variant="link"
                        className="p-0 ms-auto"
                        onClick={() => handleRemoveCategory(category.id)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

                <Form.Group className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Category Name"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory(prev => ({
                      ...prev,
                      label: e.target.value
                    }))}
                  />
                </Form.Group>
                <Row className="mb-2">
                  <Col>
                    <Form.Select
                      value={newCategory.type}
                      onChange={(e) => setNewCategory(prev => ({
                        ...prev,
                        type: e.target.value
                      }))}
                    >
                      {categoryTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col>
                    <Form.Control
                      type="number"
                      placeholder="Price"
                      value={newCategory.basePrice || ''}
                      onChange={(e) => setNewCategory(prev => ({
                        ...prev,
                        basePrice: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </Col>
                </Row>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="mb-3 w-100"
                  onClick={handleAddCategory}
                >
                  <Plus size={16} className="me-1" /> Add Category
                </Button>

                <h6 className="mt-4 mb-3">Layout Tools</h6>
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
                    <h6 className="mt-4 mb-3">Seat Category</h6>
                    {categories.map(category => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'primary' : 'outline-secondary'}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-100 mb-2 category-${category.color.toLowerCase()}`}
                      >
                        {category.label} (₹{category.basePrice})
                      </Button>
                    ))}

                    <h6 className="mt-4 mb-3">Seat Type</h6>
                    <Form.Select
                      value={selectedSeatType}
                      onChange={(e) => setSelectedSeatType(e.target.value)}
                      className="mb-3"
                    >
                      {seatTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Form.Select>
                  </>
                )}

                <h6 className="mt-4 mb-3">Grid Dimensions</h6>
                <Row className="g-2 mb-4">
                  <Col>
                    <Form.Control
                      type="number"
                      value={dimensions.rows}
                      onChange={(e) => {
                        const newRows = Math.max(1, parseInt(e.target.value) || 1);
                        setDimensions(prev => ({
                          ...prev,
                          rows: newRows
                        }));
                        initializeGrid();
                      }}
                      min="1"
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-center">×</Col>
                  <Col>
                    <Form.Control
                      type="number"
                      value={dimensions.columns}
                      onChange={(e) => {
                        const newColumns = Math.max(1, parseInt(e.target.value) || 1);
                        setDimensions(prev => ({
                          ...prev,
                          columns: newColumns
                        }));
                        initializeGrid();
                      }}
                      min="1"
                    />
                  </Col>
                </Row>

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    onClick={handleSubmit}
                    disabled={localLoading}
                  >
                    <Save size={16} className="me-2" />
                    {localLoading ? 'Saving...' : 'Save Configuration'}
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    onClick={handleCancel}
                    disabled={localLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8} lg={9}>
          <Card>
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Screen Layout Designer</h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="light" 
                  size="sm"
                  onClick={handleUndo}
                  disabled={currentStep === 0}
                >
                  <RotateCcw size={16} /> Undo
                </Button>
                <Button 
                  variant="light" 
                  size="sm"
                  onClick={handleRedo}
                  disabled={currentStep === history.length - 1}
                >
                  <RotateCcw size={16} className="rotate-180" /> Redo
                </Button>
                <Button 
                  variant="light" 
                  size="sm"
                  onClick={initializeGrid}
                >
                  <Eraser size={16} /> Clear
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="theater-grid-container">
                <div className="theater-screen mb-4">
                  <Monitor size={20} />
                  <span>Screen</span>
                </div>
                <div 
                  className={`theater-grid ${isDrawing ? 'is-drawing' : ''}`}
                  onMouseLeave={() => setIsDrawing(false)}
                >
                  <div className="grid-content" style={{ padding: '20px' }}>
                    {/* Column Numbers */}
                    <div className="d-flex">
                      <div style={{ width: '40px' }}></div>
                      {Array.from({ length: dimensions.columns }).map((_, index) => (
                        <div key={index} style={{ width: '40px', textAlign: 'center' }}>
                          {index + 1}
                        </div>
                      ))}
                    </div>
                    
                    {/* Grid with Row Labels */}
                    {Array.from({ length: dimensions.rows }).map((_, rowIndex) => (
                      <div key={rowIndex} className="d-flex align-items-center mb-1">
                        <div style={{ width: '40px', textAlign: 'center', fontWeight: '500' }}>
                          {String.fromCharCode(65 + rowIndex)}
                        </div>
                        {Array.from({ length: dimensions.columns }).map((_, colIndex) => {
                          const cell = grid[rowIndex]?.[colIndex] || { type: 'EMPTY', category: null };
                          const cellStyle = {
                            ...gridStyles.cell,
                            ...(cell.type === 'SEAT' 
                              ? gridStyles[categories.find(c => c.id === cell.category)?.color || 'empty']
                              : cell.type === 'EMPTY'
                                ? gridStyles.empty
                                : gridStyles[cell.type.toLowerCase()])
                          };
                          
                          // Add seat type indicator for special seats
                          const seatTypeIndicator = cell.type === 'SEAT' && cell.seatType !== 'REGULAR'
                            ? { 
                                'RECLINER': '🛋️',
                                'WHEELCHAIR': '♿',
                                'COMPANION': '👥',
                                'VIP': '⭐'
                              }[cell.seatType]
                            : '';
                          
                          return (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              style={cellStyle}
                              onClick={() => handleCellClick(rowIndex, colIndex)}
                              onMouseDown={() => setIsDrawing(true)}
                              onMouseEnter={() => isDrawing && handleCellClick(rowIndex, colIndex)}
                              onMouseUp={() => setIsDrawing(false)}
                              title={cell.type === 'SEAT' 
                                ? `${cell.seatNumber} - ${cell.seatType} - ${categories.find(c => c.id === cell.category)?.label}`
                                : cell.type}
                              className={`grid-cell ${cell.type.toLowerCase()}`}
                            >
                              {cell.type === 'EXIT' ? 'EXIT' :
                               cell.type === 'STAIRS' ? '↑' :
                               cell.type === 'SEAT' ? (
                                 <div className="seat-content">
                                   <small>{cell.seatNumber}</small>
                                   {seatTypeIndicator && (
                                     <span className="seat-type-indicator">{seatTypeIndicator}</span>
                                   )}
                                 </div>
                               ) : ''}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 border-top">
                <h6 className="mb-3">Legend</h6>
                <div className="d-flex flex-wrap gap-3">
                  {categories.map(category => (
                    <div key={category.id} className="d-flex align-items-center gap-2">
                      <div
                        className="legend-box"
                        style={{ backgroundColor: gridStyles[category.color]?.backgroundColor }}
                      ></div>
                      <span>{category.label} - ₹{category.basePrice}</span>
                    </div>
                  ))}
                  <div className="d-flex align-items-center gap-2">
                    <div className="legend-box" style={gridStyles.aisle}></div>
                    <span>Aisle</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="legend-box" style={gridStyles.stairs}>↑</div>
                    <span>Stairs</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="legend-box" style={gridStyles.exit}>EXIT</div>
                    <span>Exit</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="legend-box" style={gridStyles.gap}></div>
                    <span>Gap</span>
                  </div>
                </div>

                <h6 className="mt-4 mb-3">Seat Types</h6>
                <div className="d-flex flex-wrap gap-3">
                  {seatTypes.map(type => (
                    <div key={type.value} className="d-flex align-items-center gap-2">
                      <div className="legend-box">
                        {type.value === 'REGULAR' ? 'A1' :
                         type.value === 'RECLINER' ? '🛋️' :
                         type.value === 'WHEELCHAIR' ? '♿' :
                         type.value === 'COMPANION' ? '👥' :
                         type.value === 'VIP' ? '⭐' : ''}
                      </div>
                      <span>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ScreenSetup;