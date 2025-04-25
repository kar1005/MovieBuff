/**
 * Utilities for seat mapping and selection
 */

/**
 * Gets category color based on category name
 * @param {String} category - The category name
 * @returns {String} CSS color value
 */
export const getCategoryColor = (category) => {
    const colors = {
      'PREMIUM': '#673ab7',
      'EXECUTIVE': '#2196f3',
      'GOLD': '#ffc107',
      'SILVER': '#90a4ae', 
      'STANDARD': '#4caf50',
      'RECLINER': '#d32f2f',
      'VIP': '#ff5722',
      'GOOD': '#4caf50',
      'OK': '#90a4ae',
      'VERY GOOD': '#673ab7'
    };
    
    // Handle case insensitivity
    const normalizedCategory = category?.toUpperCase();
    return colors[normalizedCategory] || '#444';
  };
  
  /**
   * Generates a human-readable seat label from row and column
   * @param {Number} row - The row index
   * @param {Number} column - The column index
   * @returns {String} Seat label (e.g., "A1", "B2")
   */
  export const getSeatLabel = (row, column) => {
    return `${String.fromCharCode(65 + row)}${column + 1}`;
  };
  
  /**
   * Creates a seat ID from row and column (for compatibility with older code)
   * @param {Number} row - The row index
   * @param {Number} column - The column index
   * @returns {String} Seat ID in the format "row-column" (e.g., "0-0", "1-2")
   */
  export const createSeatId = (row, column) => {
    return `${row}-${column}`;
  };
  
  /**
   * Extracts row and column from a seat ID
   * @param {String} seatId - The seat ID (e.g., "A1", "B2", "0-0", "1-2")
   * @returns {Object} Object with row and column properties
   */
  export const getSeatCoordinates = (seatId) => {
    if (!seatId || typeof seatId !== 'string') {
      return { row: -1, column: -1 };
    }
    
    try {
      // Extract the row letter and column number for letter-number format (e.g., "A1")
      const letterMatch = seatId.match(/^([A-Z])(\d+)$/);
      if (letterMatch) {
        const rowLetter = letterMatch[1];
        const columnNumber = parseInt(letterMatch[2], 10);
        
        // Convert row letter to row index (A=0, B=1, etc.)
        const rowIndex = rowLetter.charCodeAt(0) - 65;
        
        // Column index is 0-based (column 1 is index 0)
        const columnIndex = columnNumber - 1;
        
        return { row: rowIndex, column: columnIndex };
      }
      
      // Handle numeric row-column format (e.g., "12-5")
      const numericMatch = seatId.match(/^(\d+)-(\d+)$/);
      if (numericMatch) {
        return {
          row: parseInt(numericMatch[1], 10),
          column: parseInt(numericMatch[2], 10)
        };
      }
    } catch (error) {
      console.error(`Error parsing seat ID ${seatId}:`, error);
    }
    
    return { row: -1, column: -1 };
  };
  
  /**
   * Calculates total price for selected seats based on show data
   * @param {Array} selectedSeats - Array of selected seat IDs
   * @param {Object} show - Show data from API
   * @returns {Number} Total price
   */
  export const calculateTotalPrice = (selectedSeats, show) => {
    if (!selectedSeats || !show || !show.seatStatus || !show.pricing) {
      return 0;
    }
    
    let totalPrice = 0;
    
    selectedSeats.forEach(seatId => {
      // Find this seat in the show's seatStatus
      const seat = show.seatStatus.find(s => s.seatId === seatId);
      
      if (seat && seat.category && show.pricing[seat.category]) {
        totalPrice += show.pricing[seat.category].finalPrice;
      }
    });
    
    return totalPrice;
  };
  
  /**
   * Finds a seat in the show's seatStatus by its ID
   * @param {String} seatId - The seat ID to find
   * @param {Object} show - Show data from API
   * @returns {Object|null} The seat object or null if not found
   */
  export const findSeatById = (seatId, show) => {
    if (!show || !show.seatStatus) {
      return null;
    }
    
    return show.seatStatus.find(seat => seat.seatId === seatId) || null;
  };
  
  /**
   * Creates a booking request object from selected seats and show data
   * @param {Array} selectedSeats - Array of selected seat IDs
   * @param {Object} show - Show data from API
   * @param {String} userId - User ID
   * @returns {Object} Booking request object for the API
   */
  export const createBookingRequest = (selectedSeats, show, userId) => {
    if (!selectedSeats || !show || !userId) {
      return null;
    }
    
    // Map selected seats to booking seat objects
    const seats = selectedSeats.map(seatId => {
      const seatInfo = findSeatById(seatId, show);
      
      if (!seatInfo) {
        console.error(`Seat ${seatId} not found in show data`);
        return null;
      }
      
      const category = seatInfo.category;
      const pricing = show.pricing[category];
      
      return {
        seatId: seatInfo.seatId,
        row: seatInfo.row,
        column: seatInfo.column,
        category: category,
        basePrice: pricing ? pricing.basePrice : 0,
        finalPrice: pricing ? pricing.finalPrice : 0
      };
    }).filter(Boolean); // Remove any null entries
    
    // Calculate subtotal
    const subtotal = seats.reduce((sum, seat) => sum + seat.finalPrice, 0);
    
    // Calculate convenience fee (5%)
    const convenienceFee = subtotal * 0.05;
    
    return {
      userId,
      showId: show.id,
      seats,
      totalSeats: seats.length,
      subtotalAmount: subtotal,
      discountAmount: 0, // Will be updated if coupon is applied
      additionalCharges: convenienceFee,
      totalAmount: subtotal + convenienceFee
    };
  };