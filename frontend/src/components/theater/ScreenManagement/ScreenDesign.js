// src/pages/theater/ScreenDesign.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Badge,
  Nav,
  Tab,
  InputGroup,
  Tooltip,
  OverlayTrigger
} from "react-bootstrap";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  Monitor, 
  Save, 
  Eraser, 
  RotateCcw, 
  Plus, 
  X, 
  ArrowLeft, 
  Layers, 
  Grid as GridIcon, 
  Tag, 
  Settings,
  Sofa,
  Accessibility,
  Users,
  Star,
  Square
} from "lucide-react";
import {
  addScreen,
  fetchTheaterById,
  updateScreen,
} from "../../../redux/slices/theaterSlice";
import "../../../styles/ScreenSetup.css";

const ScreenDesign = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theaterId, screenId } = useParams();

  // Get screen configuration from state
  const screenConfigFromState = location.state?.screenConfig;
  console.log("screenConfigFromState : " + JSON.stringify(screenConfigFromState));
  
  useEffect(() => {
    if (screenConfigFromState) {
      setScreenConfig({
        screenNumber: screenConfigFromState.screenNumber || "",
        screenName: screenConfigFromState.screenName || "",
        supportedExperiences: screenConfigFromState.supportedExperiences || [],
        // Handle either features or screenFeatures from the incoming data
        features: screenConfigFromState.features || {
          screenWidth: screenConfigFromState.screenFeatures?.screenWidth || 0,
          screenHeight: screenConfigFromState.screenFeatures?.screenHeight || 0,
          projectorType: screenConfigFromState.screenFeatures?.projectorType || "",
          soundSystem: screenConfigFromState.screenFeatures?.soundSystem || "",
        },
        totalSeats: screenConfigFromState.totalSeats || 0,
        isActive: screenConfigFromState.isActive !== undefined ? screenConfigFromState.isActive : true,
      });
    }
  }, [screenConfigFromState]);
  
  const currentTheater = useSelector((state) => state.theater.currentTheater);
  const loading = useSelector((state) => state.theater.loading);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Screen configuration state
  const [screenConfig, setScreenConfig] = useState(() => {
    // Create a properly merged default object
    const defaultConfig = {
      screenNumber: "",
      screenName: "",
      supportedExperiences: [],
      screenFeatures: {
        screenWidth: 0,
        screenHeight: 0,
        projectorType: "",
        soundSystem: "",
      },
      totalSeats: 0,
      isActive: true
    };
  
    // If we have config from state, properly merge it
    if (screenConfigFromState) {
      return {
        ...defaultConfig,
        ...screenConfigFromState,
        // Explicitly handle nested screenFeatures object
        features: screenConfigFromState.features || {
          ...defaultConfig.features,
          ...(screenConfigFromState.screenFeatures || {})
        }
      };
    }
    
    return defaultConfig;
  });
  console.log("screenConfig : " + JSON.stringify(screenConfig));

  // Tools for the grid design
  const tools = [
    { id: "SEAT", label: "Seat", color: "primary", icon: <Square size={16} /> },
    { id: "AISLE", label: "Aisle", color: "info", icon: <Layers size={16} /> },
    { id: "STAIRS", label: "Stairs", color: "warning", icon: <GridIcon size={16} /> },
    { id: "EXIT", label: "Exit", color: "danger", icon: <Settings size={16} /> },
    { id: "GAP", label: "Gap", color: "secondary", icon: <Tag size={16} /> },
    { id: "ERASER", label: "Eraser", color: "dark", icon: <Eraser size={16} /> },
  ];

  const [categories, setCategories] = useState([]); // For the list of categories
  const [newCategory, setNewCategory] = useState({
    label: "",
    type: "premium",
    color: "#9333ea", // Default color matching premium
    basePrice: 0,
  });

  // Category and seat type options
  const categoryTypes = [
    { value: "premium", label: "Premium (Purple)", color: "#9333ea" },
    { value: "gold", label: "Gold (Yellow)", color: "#fbbf24" },
    { value: "silver", label: "Silver (Gray)", color: "#9ca3af" },
    { value: "bronze", label: "Bronze (Brown)", color: "#b45309" },
    { value: "platinum", label: "Platinum (Light Blue)", color: "#7dd3fc" },
    { value: "diamond", label: "Diamond (Teal)", color: "#14b8a6" },
    { value: "ruby", label: "Ruby (Red)", color: "#ef4444" },
    { value: "emerald", label: "Emerald (Green)", color: "#10b981" },
    { value: "sapphire", label: "Sapphire (Blue)", color: "#3b82f6" },
    { value: "amber", label: "Amber (Orange)", color: "#f59e0b" },
  ];

  const seatTypes = [
    { value: "REGULAR", label: "Regular", icon: "A1" },
    { value: "RECLINER", label: "Recliner", icon: "🛋️" },
    { value: "WHEELCHAIR", label: "Wheelchair", icon: "♿" },
    { value: "COMPANION", label: "Companion", icon: "👥" },
    { value: "VIP", label: "VIP", icon: "⭐" },
  ];

  // Grid state
  const [dimensions, setDimensions] = useState({ rows: 10, columns: 15 });
  const [selectedTool, setSelectedTool] = useState("SEAT");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSeatType, setSelectedSeatType] = useState("REGULAR");
  const [grid, setGrid] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('tools');

  // Fetch theater data
  useEffect(() => {
    if (theaterId) {
      dispatch(fetchTheaterById(theaterId));
    }
  }, [dispatch, theaterId]);

  // Initialize or fetch screen data
  useEffect(() => {
    if (currentTheater && screenId) {
      const existingScreen = currentTheater.screens?.find(
        (screen) => screen.screenNumber === parseInt(screenId)
      );
      if (existingScreen) {
        initializeExistingScreen(existingScreen);
      }
    }
  }, [currentTheater, screenId]);

  // Initialize grid when dimensions change
  useEffect(() => {
    // Only create a new empty grid when we don't have an existing layout to load
    // or when dimensions are explicitly changed by the user
    if (!currentTheater || !screenId || history.length > 1) {
      const newGrid = Array(dimensions.rows)
        .fill(null)
        .map(() =>
          Array(dimensions.columns)
            .fill(null)
            .map(() => ({
              type: "EMPTY",
              category: null,
              seatType: null,
              seatNumber: null,
              isActive: true,
            }))
        );
      setGrid(newGrid);
      setHistory([newGrid]);
      setCurrentStep(0);
    }
  }, [dimensions.rows, dimensions.columns]);

  // Initialize existing screen data
  const initializeExistingScreen = (screen) => {
    // Check if we have state from navigation
    if (screenConfigFromState) {
      setScreenConfig(screenConfigFromState);
    } else {
      // Loading from server - maintain proper field mapping
      const updatedConfig = {
        screenNumber: screen.screenNumber,
        screenName: screen.screenName,
        supportedExperiences: screen.supportedExperiences || 
                             screenConfig.supportedExperiences || 
                             [],
        features: {
          screenWidth: screen.features?.screenWidth || 
                      screenConfig.features?.screenWidth || 0,
          screenHeight: screen.features?.screenHeight || 
                       screenConfig.features?.screenHeight || 0,
          projectorType: screen.features?.projectorType || 
                        screenConfig.features?.projectorType || "",
          soundSystem: screen.features?.soundSystem || 
                      screenConfig.features?.soundSystem || ""
        },
        totalSeats: screen.totalSeats || screenConfig.totalSeats || 0,
        isActive: screen.isActive !== undefined ? screen.isActive : true,
      };
      
      setScreenConfig(updatedConfig);
    }

    // Process categories from layout, if available
    if (screen.layout?.sections) {
      const existingCategories = screen.layout.sections.map(
        (section, index) => ({
          id: `CATEGORY_${index + 1}`,
          label: section.categoryName,
          type: section.categoryType.toLowerCase(),
          color: section.color || gridStyles[section.categoryType.toLowerCase()]?.backgroundColor || "#9333ea",
          basePrice: section.basePrice,
        })
      );
      setCategories(existingCategories);
      
      // Set selected category to first one if available
      if (existingCategories.length > 0) {
        setSelectedCategory(existingCategories[0].id);
      }
    }

    // Setup grid from layout if it exists
    if (screen.layout) {
      setDimensions({
        rows: screen.layout.totalRows,
        columns: screen.layout.totalColumns,
      });
      
      // Process grid after a short delay to ensure screenConfig is updated
      setTimeout(() => {
        setupGridFromLayout(screen.layout);
      }, 0);
    }
  };

  // Setup grid from existing layout
  const setupGridFromLayout = (layout) => {
    if (!layout?.totalRows || !layout?.totalColumns) {
      return;
    }
    
    // Set dimensions first
    setDimensions({
      rows: layout.totalRows,
      columns: layout.totalColumns
    });
    
    // Create empty grid with proper dimensions
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
    if (layout.sections) {
      layout.sections.forEach((section) => {
        const category = categories.find(cat => 
          cat.label === section.categoryName && 
          cat.type === section.categoryType
        );
        
        if (section.seats) {
          section.seats.forEach((seat) => {
            const row = seat.row - 1;
            const col = seat.column - 1;
            
            if (row >= 0 && row < layout.totalRows && col >= 0 && col < layout.totalColumns) {
              newGrid[row][col] = {
                type: "SEAT",
                category: category?.id,
                seatType: seat.type || "REGULAR",
                seatNumber: seat.seatNumber,
                isActive: seat.isActive,
              };
            }
          });
        }
      });
    }
  
    // Map aisles
    layout.aisles?.forEach((aisle) => {
      for (let row = aisle.startPosition - 1; row < aisle.endPosition; row++) {
        const col = aisle.position - 1;
        if (row >= 0 && row < layout.totalRows && col >= 0 && col < layout.totalColumns) {
          newGrid[row][col] = { type: "AISLE", category: null };
        }
      }
    });
  
    // Map stairs - Update to handle flat structure
    layout.stairs?.forEach((stair) => {
      // Use row and column directly instead of looking for a location object
      const row = stair.row - 1;
      const col = stair.column - 1;
      
      if (row >= 0 && row < layout.totalRows && col >= 0 && col < layout.totalColumns) {
        newGrid[row][col] = { type: "STAIRS", category: null };
      }
    });

    // Map exits - Update to handle flat structure
    layout.exits?.forEach((exit) => {
      // Use row and column directly instead of looking for a location object
      const row = exit.row - 1;
      const col = exit.column - 1;
      
      if (row >= 0 && row < layout.totalRows && col >= 0 && col < layout.totalColumns) {
        newGrid[row][col] = { type: "EXIT", category: null };
      }
    });
  
    // Map gaps
    layout.seatGaps?.forEach((gap) => {
      const row = gap.row - 1;
      const col = gap.column - 1;
      if (row >= 0 && row < layout.totalRows && col >= 0 && col < layout.totalColumns) {
        newGrid[row][col] = { type: "GAP", category: null };
      }
    });
  
    // Set the grid and history
    setGrid(newGrid);
    setHistory([newGrid]);
    setCurrentStep(0);
  };
  
  // Handle dimension changes
  const handleDimensionChange = (type, value) => {
    const newValue = Math.max(1, parseInt(value) || 1);
    if (newValue === dimensions[type]) return;
  
    setDimensions(prev => ({
      ...prev,
      [type]: newValue
    }));
  };

  // Clear the grid
  const handleClearGrid = () => {
    const newGrid = Array(dimensions.rows).fill(null).map(() =>
      Array(dimensions.columns).fill(null).map(() => ({
        type: "EMPTY",
        category: null,
        seatType: null,
        seatNumber: null,
        isActive: true
      }))
    );
    setGrid(newGrid);
    addToHistory(newGrid);
  };

  // Category management
  const handleRemoveCategory = (categoryId) => {
    const updatedCategories = categories.filter((cat) => cat.id !== categoryId);
    setCategories(updatedCategories);
  
    if (selectedCategory === categoryId) {
      setSelectedCategory(updatedCategories[0]?.id || null);
    }
  
    // Update grid to remove seats with deleted category
    const updatedGrid = grid.map((row) =>
      row.map((cell) => {
        if (cell.type === "SEAT" && cell.category === categoryId) {
          return {
            type: "EMPTY",
            category: null,
            seatType: null,
            seatNumber: null,
            isActive: true,
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
      setError("Please provide a category name and valid price");
      return;
    }
  
    const categoryExists = categories.some(
      (cat) => cat.label.toLowerCase() === newCategory.label.toLowerCase()
    );
  
    if (categoryExists) {
      setError("A category with this name already exists");
      return;
    }
  
    // Get color value from the selected category type
    const selectedCategoryType = categoryTypes.find(type => type.value === newCategory.type);
    const colorValue = selectedCategoryType?.color || "#9333ea";

    const categoryId = `CATEGORY_${categories.length + 1}`;
    const newCategoryItem = {
      id: categoryId,
      label: newCategory.label,
      type: newCategory.type,
      color: colorValue, // Store the actual hex color
      basePrice: newCategory.basePrice,
    };
  
    const updatedCategories = [...categories, newCategoryItem];
    setCategories(updatedCategories);
    
    // Automatically select the newly added category if none is selected
    if (!selectedCategory) {
      setSelectedCategory(categoryId);
    }
    
    // Reset the form 
    setNewCategory({
      label: "",
      type: "premium",
      color: "#9333ea",
      basePrice: 0
    });
    
    setError("");
  };
  
  // Grid cell click handler with safety check
  const handleCellClick = (row, col) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    if (selectedTool === "ERASER") {
      newGrid[row][col] = {
        type: "EMPTY",
        category: null,
        seatType: null,
        seatNumber: null,
        isActive: true,
      };
    } else if (selectedTool === "SEAT") {
      // Check if a category is selected
      if (!selectedCategory) {
        setError("Please select or create a seat category first");
        return;
      }
      
      newGrid[row][col] = {
        type: "SEAT",
        category: selectedCategory,
        seatType: selectedSeatType,
        seatNumber: `${String.fromCharCode(65 + row)}${col + 1}`,
        isActive: true,
      };
    } else {
      newGrid[row][col] = {
        type: selectedTool,
        category: null,
        seatType: null,
        seatNumber: null,
        isActive: true,
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
    const sections = categories.map((category) => ({
      categoryName: category.label,
      categoryType: category.type,
      basePrice: category.basePrice,
      color: category.color, // This should now be the hex color code
      seats: [],
    }));

    const layoutData = {
      totalRows: dimensions.rows,
      totalColumns: dimensions.columns,
      sections: [],
      aisles: [],
      stairs: [],
      exits: [],
      seatGaps: [],
    };

    let totalSeats = 0;

    // Process grid cells
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.type === "SEAT") {
          // Find the matching category for this seat
          const category = categories.find(c => c.id === cell.category);
          
          // Find the matching section for this category
          if (category) {
            const section = sections.find(s => s.categoryName === category.label);
            
            if (section) {
              section.seats.push({
                row: rowIndex + 1,
                column: colIndex + 1,
                seatNumber: cell.seatNumber,
                type: cell.seatType,
                isActive: cell.isActive,
              });
              totalSeats++;
            }
          }
        } else if (cell.type === "AISLE") {
          layoutData.aisles.push({
            type: "VERTICAL",
            position: colIndex + 1,
            startPosition: rowIndex + 1,
            endPosition: rowIndex + 1,
            width: 1,
          });
        } else if (cell.type === "STAIRS") {
          layoutData.stairs.push({
            type: "ENTRY",
            row: rowIndex + 1,
            column: colIndex + 1,
            width: 1,
            direction: "CENTER",
          });
        } else if (cell.type === "EXIT") {
          layoutData.exits.push({
            gateNumber: `E${layoutData.exits.length + 1}`,
            row: rowIndex + 1,
            column: colIndex + 1,
            type: "EMERGENCY",
            width: 1,
          });
        } else if (cell.type === "GAP") {
          layoutData.seatGaps.push({
            row: rowIndex + 1,
            column: colIndex + 1,
            width: 1,
          });
        }
      });
    });

    // Add non-empty sections to layout
    layoutData.sections = sections.filter(
      (section) => section.seats.length > 0
    );

    return { layoutData, totalSeats };
  };

  // Form submission handler
  const handleSubmit = async () => {
    setLocalLoading(true);
    setError("");

    try {
      const { layoutData, totalSeats } = createLayoutData();

      // Properly structure the screen data
      const screenData = {
        screenNumber: screenConfig.screenNumber,
        screenName: screenConfig.screenName,
        supportedExperiences: screenConfig.supportedExperiences,
        layout: layoutData,
        features: screenConfig.features,
        totalSeats,
        isActive: screenConfig.isActive,
      };

      if (screenId) {
        await dispatch(
          updateScreen({ theaterId, screenId, data: screenData })
        ).unwrap();
      } else {
        await dispatch(addScreen({ theaterId, data: screenData })).unwrap();
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/manager/theaters/${theaterId}/screens`);
      }, 2000);
    } catch (err) {
      setError(err.message || "Error saving screen configuration");
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Get cell style based on type and category
  const getCellStyle = (cell) => {
    const baseStyle = { ...gridStyles.cell };
    
    if (cell.type === "SEAT") {
      const category = categories.find(c => c.id === cell.category);
      if (category) {
        return {
          ...baseStyle,
          backgroundColor: category.color, // Use the stored hex color directly
          color: getContrastColor(category.color) // Helper function to determine text color
        };
      }
      return {
        ...baseStyle,
        ...gridStyles.empty
      };
    }
    
    return {
      ...baseStyle,
      ...(cell.type === "EMPTY" ? gridStyles.empty : gridStyles[cell.type.toLowerCase()])
    };
  };
  
  // Helper function to determine text color based on background brightness
  const getContrastColor = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return white for dark backgrounds, black for light backgrounds
    return brightness > 128 ? 'black' : 'white';
  };

  // Navigation handlers
  const handleCancel = () => {
    navigate(`/manager/theaters/${theaterId}/screens`);
  };
  
  const handleBackToConfig = () => {
    navigate(`/manager/theaters/${theaterId}/screens/${screenId ? screenId + '/edit' : 'add'}`, {
      state: { screenConfig }
    });
  };

  // Grid cell styles
  const gridStyles = {
    cell: {
      width: "40px",
      height: "40px",
      border: "1px solid #dee2e6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      cursor: "pointer",
      transition: "all 0.2s",
      margin: "1px",
    },
    premium: { backgroundColor: "#9333ea", color: "white" },
    gold: { backgroundColor: "#fbbf24", color: "black" },
    silver: { backgroundColor: "#9ca3af", color: "white" },
    bronze: { backgroundColor: "#b45309", color: "white" },
    platinum: { backgroundColor: "#7dd3fc", color: "black" },
    diamond: { backgroundColor: "#14b8a6", color: "white" },
    ruby: { backgroundColor: "#ef4444", color: "white" },
    emerald: { backgroundColor: "#10b981", color: "white" },
    sapphire: { backgroundColor: "#3b82f6", color: "white" },
    amber: { backgroundColor: "#f59e0b", color: "black" },
    aisle: { backgroundColor: "#e2e8f0", backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)' },
    stairs: { backgroundColor: "#fde68a", color: "#000" },
    exit: { backgroundColor: "#ef4444", color: "white" },
    gap: { backgroundColor: "#f3f4f6", backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)' },
    empty: { backgroundColor: "#ffffff" },
  };
  
  // If theaterId is not available, show error
  if (!theaterId) {
    return (
      <Container fluid className="py-3">
        <Alert variant="danger">
          Theater ID is required. Please select a theater first.
        </Alert>
      </Container>
    );
  }

  // Generate tooltip for remaining history steps
  const renderTooltip = (props, text) => (
    <Tooltip id="button-tooltip" {...props}>
      {text}
    </Tooltip>
  );

  return (
    <Container fluid className="p-0">
      {showSuccess && (
        <Alert variant="success" className="mb-3 mx-3">
          Screen configuration saved successfully! Redirecting...
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          className="mb-3 mx-3"
          onClose={() => setError("")}
          dismissible
        >
          {error}
        </Alert>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-3 px-3 py-2 border-bottom">
        <Button variant="outline-secondary" onClick={handleBackToConfig} className="d-flex align-items-center">
          <ArrowLeft size={16} className="me-1" /> Back to Configuration
        </Button>
        
        <div className="d-none d-md-flex align-items-center">
          <h5 className="mb-0 text-primary d-flex align-items-center">
            <Monitor size={18} className="me-2" />
            {screenConfig.screenName} (#{screenConfig.screenNumber})
          </h5>
        </div>
        
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={localLoading}
            className="d-flex align-items-center"
          >
            <Save size={16} className="me-2" />
            {localLoading ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleCancel}
            disabled={localLoading}
          >
            Cancel
          </Button>
        </div>
      </div>

      <Row className="g-0">
        {/* Side panel for tools, categories, settings */}
        <Col lg={3} md={4} className="border-end">
          <div className="tools-panel">
            <Tab.Container 
              activeKey={activeTab} 
              onSelect={(k) => setActiveTab(k)}
              id="layout-tabs"
            >
              <Nav variant="tabs" className="px-2 pt-2">
                <Nav.Item>
                  <Nav.Link eventKey="tools" className="d-flex align-items-center">
                    <GridIcon size={14} className="me-1" /> Tools
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="categories" className="d-flex align-items-center">
                    <Tag size={14} className="me-1" /> Categories
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="settings" className="d-flex align-items-center">
                    <Settings size={14} className="me-1" /> Settings
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              
              <Tab.Content className="p-3">
                <Tab.Pane eventKey="tools">
                  <h6 className="fw-bold mb-3">Design Tools</h6>
                  <div className="d-grid gap-2 mb-4">
                    {tools.map((tool) => (
                      <Button
                        key={tool.id}
                        variant={selectedTool === tool.id ? tool.color : "outline-secondary"}
                        onClick={() => setSelectedTool(tool.id)}
                        className="d-flex align-items-center"
                      >
                        {tool.icon}
                        <span className="ms-2">{tool.label}</span>
                      </Button>
                    ))}
                  </div>

                  {selectedTool === "SEAT" && (
                    <>
                      {/* Category selection moved above seat type */}
                      {categories.length > 0 && (
                        <div className="mb-3">
                          <h6 className="fw-bold mb-2">Select Category</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <Badge
                              key={category.id}
                              style={{
                                backgroundColor: category.color,
                                color: getContrastColor(category.color),
                                cursor: 'pointer',
                                opacity: selectedCategory === category.id ? 1 : 0.6,
                                border: selectedCategory === category.id ? '2px solid #555' : 'none'
                              }}
                              className="py-2 px-3"
                              onClick={() => setSelectedCategory(category.id)}
                            >
                              {category.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <h6 className="fw-bold mb-2">Seat Type</h6>
                    <div className="mb-3 d-flex flex-wrap">
                      {seatTypes.map((type) => (
                        <Button
                          key={type.value}
                          variant={selectedSeatType === type.value ? "primary" : "outline-secondary"}
                          onClick={() => setSelectedSeatType(type.value)}
                          className="me-2 mb-2"
                          size="sm"
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </Tab.Pane>
              
              <Tab.Pane eventKey="categories">
                <h6 className="fw-bold mb-3">Category Management</h6>
                
                {/* Category List */}
                <div className="mb-3 border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {categories.length === 0 ? (
                    <div className="text-center py-2 text-muted">
                      <small>No categories defined yet</small>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className={`d-flex align-items-center p-2 mb-1 rounded ${selectedCategory === category.id ? 'bg-light' : ''}`}
                        onClick={() => setSelectedCategory(category.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Badge 
                          style={{ 
                            backgroundColor: category.color, 
                            color: getContrastColor(category.color) 
                          }} 
                          className="me-2"
                        >
                          {category.label}
                        </Badge>
                        <small className="text-muted me-2">
                          ₹{category.basePrice}
                        </small>
                        <Button
                          variant="link"
                          className="p-0 ms-auto text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCategory(category.id);
                          }}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Add Category Form */}
                <Card className="mb-3 border">
                  <Card.Body className="p-2">
                    <h6 className="fw-bold mb-2">Add New Category</h6>
                    <Form.Group className="mb-2">
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="Category Name"
                        value={newCategory.label}
                        onChange={(e) =>
                          setNewCategory((prev) => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                    
                    <Row className="mb-2 g-2">
                      <Col>
                        <Form.Select
                          size="sm"
                          value={newCategory.type}
                          onChange={(e) => {
                            const selectedType = e.target.value;
                            // Get the color directly from categoryTypes array
                            const colorValue = categoryTypes.find(type => type.value === selectedType)?.color || "#9333ea";
                            setNewCategory((prev) => ({
                              ...prev,
                              type: selectedType,
                              color: colorValue,
                            }));
                          }}
                        >
                          {categoryTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col>
                        <InputGroup size="sm">
                          <InputGroup.Text>₹</InputGroup.Text>
                          <Form.Control
                            type="number"
                            placeholder="Price"
                            value={newCategory.basePrice || ""}
                            onChange={(e) =>
                              setNewCategory((prev) => ({
                                ...prev,
                                basePrice: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </InputGroup>
                      </Col>
                    </Row>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-100"
                      onClick={handleAddCategory}
                    >
                      <Plus size={14} className="me-1" /> Add Category
                    </Button>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              <Tab.Pane eventKey="settings">
                <h6 className="fw-bold mb-3">Grid Dimensions</h6>
                <Row className="g-2 mb-4 align-items-center">
                  <Col>
                    <Form.Label className="mb-1 small">Rows</Form.Label>
                    <Form.Control
                      size="sm"
                      type="number"
                      value={dimensions.rows}
                      onChange={(e) => handleDimensionChange('rows', e.target.value)}
                      min="1"
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-center pt-3">
                    ×
                  </Col>
                  <Col>
                    <Form.Label className="mb-1 small">Columns</Form.Label>
                    <Form.Control
                      size="sm"
                      type="number"
                      value={dimensions.columns}
                      onChange={(e) => handleDimensionChange('columns', e.target.value)}
                      min="1"
                    />
                  </Col>
                </Row>
                
                <h6 className="fw-bold mb-2">Legend</h6>
                <div className="mb-3 small">
                  <h6 className="fw-bold mb-2 mt-3 small">Tools</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {tools.map(tool => (
                      <div key={tool.id} className="d-flex align-items-center me-3 mb-2">
                        <div 
                          className="legend-box me-1" 
                          style={tool.id === "EMPTY" ? 
                            gridStyles.empty : 
                            gridStyles[tool.id.toLowerCase()]}
                        >
                          {tool.id === "EXIT" ? "EXIT" : 
                           tool.id === "STAIRS" ? "↑" : 
                           tool.id === "AISLE" ? "≡" :
                           tool.id === "GAP" ? "◦" : ""}
                        </div>
                        <span>{tool.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  <h6 className="fw-bold mb-2 mt-3 small">Categories</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {categoryTypes.map((type) => (
                      <div key={type.value} className="d-flex align-items-center me-3 mb-2">
                        <div 
                          className="legend-box me-1" 
                          style={{ 
                            backgroundColor: type.color, 
                            color: getContrastColor(type.color) 
                          }}
                        >
                          A1
                        </div>
                        <span>{type.label.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                  
                  <h6 className="fw-bold mb-2 mt-3 small">Seat Types</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {seatTypes.map((type) => (
                      <div
                        key={type.value}
                        className="d-flex align-items-center me-3 mb-2"
                      >
                        <div className="legend-box me-1">
                          {type.icon}
                        </div>
                        <span>{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>
      </Col>

      <Col lg={9} md={8}>
        <Card className="border-0 rounded-0 shadow-sm h-100">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-2">
            <h5 className="mb-0 d-flex align-items-center">
              <Monitor size={18} className="me-2" />
              Screen Layout Designer
            </h5>
            
            {/* Add history controls to the designer area */}
            <div className="d-flex align-items-center">
              <OverlayTrigger
                placement="top"
                overlay={(props) => renderTooltip(props, "Undo")}
              >
                <Button
                  variant="light"
                  size="sm"
                  onClick={handleUndo}
                  disabled={currentStep === 0}
                  className="d-flex align-items-center me-1"
                >
                  <RotateCcw size={14} />
                </Button>
              </OverlayTrigger>
              
              <OverlayTrigger
                placement="top"
                overlay={(props) => renderTooltip(props, "Redo")}
              >
                <Button
                  variant="light"
                  size="sm"
                  onClick={handleRedo}
                  disabled={currentStep === history.length - 1}
                  className="d-flex align-items-center me-1"
                >
                  <RotateCcw size={14} className="rotate-180" />
                </Button>
              </OverlayTrigger>
              
              <OverlayTrigger
                placement="top"
                overlay={(props) => renderTooltip(props, "Clear Grid")}
              >
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleClearGrid}
                  className="d-flex align-items-center"
                >
                  <Eraser size={14} />
                </Button>
              </OverlayTrigger>
            </div>
          </Card.Header>
          
          <Card.Body className="p-0">
            <div className="theater-grid-container">
              {/* Updated screen element to match grid width */}
              <div 
                className="theater-screen mb-3" 
                style={{ 
                  width: `${dimensions.columns * 42}px`, 
                  maxWidth: '100%',
                  height: '12px',
                  padding: '0',
                  borderRadius: '6px 6px 0 0'
                }}
              >
              </div>
              
              <div className="grid-designer-wrapper">
                <div
                  className={`theater-grid ${isDrawing ? "is-drawing" : ""}`}
                  onMouseLeave={() => setIsDrawing(false)}
                >
                  <div className="grid-content">
                    {/* Column Numbers */}
                    <div className="d-flex">
                      <div style={{ width: "40px" }}></div>
                      {Array.from({ length: dimensions.columns }).map(
                        (_, index) => (
                          <div
                            key={index}
                            style={{ width: "40px", textAlign: "center" }}
                          >
                            {index + 1}
                          </div>
                        )
                      )}
                    </div>

                    {/* Grid with Row Labels */}
                    {Array.from({ length: dimensions.rows }).map(
                      (_, rowIndex) => (
                        <div
                          key={rowIndex}
                          className="d-flex align-items-center mb-1"
                        >
                          <div
                            style={{
                              width: "40px",
                              textAlign: "center",
                              fontWeight: "500",
                            }}
                          >
                            {String.fromCharCode(65 + rowIndex)}
                          </div>
                          {Array.from({ length: dimensions.columns }).map(
                            (_, colIndex) => {
                              const cell = grid[rowIndex]?.[colIndex] || {
                                type: "EMPTY",
                                category: null,
                              };
                              const cellStyle = getCellStyle(cell);

                              // Get seat type indicator based on the seat type
                              const seatTypeIcon =
                                cell.type === "SEAT" && cell.seatType !== "REGULAR"
                                  ? seatTypes.find(t => t.value === cell.seatType)?.icon
                                  : "";

                              return (
                                <div
                                  key={`${rowIndex}-${colIndex}`}
                                  style={cellStyle}
                                  onClick={() =>
                                    handleCellClick(rowIndex, colIndex)
                                  }
                                  onMouseDown={() => setIsDrawing(true)}
                                  onMouseEnter={() =>
                                    isDrawing &&
                                    handleCellClick(rowIndex, colIndex)
                                  }
                                  onMouseUp={() => setIsDrawing(false)}
                                  title={
                                    cell.type === "SEAT"
                                      ? `${cell.seatNumber} - ${cell.seatType} - ${categories.find((c) => c.id === cell.category)?.label}`
                                      : cell.type
                                  }
                                  className={`grid-cell ${cell.type.toLowerCase()}`}
                                >
                                  {cell.type === "EXIT" ? (
  "EXIT"
) : cell.type === "STAIRS" ? (
  "↑"
) : cell.type === "AISLE" ? (
  "≡"
) : cell.type === "GAP" ? (
  "◦"
) : cell.type === "SEAT" ? (
  <div className="seat-content">
    <small>{cell.seatNumber}</small>
    {cell.seatType !== "REGULAR" && (
      <div className="seat-type-indicator">
        {seatTypeIcon}
      </div>
    )}
  </div>
) : (
  ""
)}
                                </div>
                              );
                            }
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Container>
);
};

export default ScreenDesign;