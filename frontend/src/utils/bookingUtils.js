/**
 * Utilities for booking management
 */

/**
 * Formats currency value
 * @param {Number} amount - The amount to format
 * @param {String} currency - Currency code (default: INR)
 * @returns {String} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR') => {
    if (amount === undefined || amount === null) {
      return '';
    }
    
    return Number(amount).toLocaleString('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    });
  };
  
  /**
   * Formats date and time from ISO string
   * @param {String} dateTimeStr - ISO date time string
   * @returns {String} Formatted date and time
   */
  export const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    const date = new Date(dateTimeStr);
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
  };
  
  /**
   * Formats date only from ISO string
   * @param {String} dateTimeStr - ISO date time string
   * @returns {String} Formatted date
   */
  export const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    const date = new Date(dateTimeStr);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
  };
  
  /**
   * Formats time only from ISO string
   * @param {String} dateTimeStr - ISO date time string
   * @returns {String} Formatted time
   */
  export const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    const date = new Date(dateTimeStr);
    const options = { hour: '2-digit', minute: '2-digit' };
    
    return date.toLocaleTimeString('en-US', options);
  };
  
  /**
   * Formats countdown timer
   * @param {Number} seconds - Seconds remaining
   * @returns {String} Formatted time (MM:SS)
   */
  export const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  /**
   * Gets status text and color for booking status
   * @param {String} status - Booking status
   * @returns {Object} Status text and color
   */
  export const getBookingStatusInfo = (status) => {
    const statusMap = {
      'INITIATED': { text: 'Initiated', color: '#ff9800' },
      'PAYMENT_PENDING': { text: 'Payment Pending', color: '#ff9800' },
      'CONFIRMED': { text: 'Confirmed', color: '#4caf50' },
      'CANCELLED': { text: 'Cancelled', color: '#f44336' },
      'REFUNDED': { text: 'Refunded', color: '#2196f3' },
      'EXPIRED': { text: 'Expired', color: '#9e9e9e' }
    };
    
    return statusMap[status] || { text: status, color: '#333' };
  };
  
  /**
   * Gets text and color for ticket status
   * @param {String} status - Ticket status
   * @returns {Object} Status text and color
   */
  export const getTicketStatusInfo = (status) => {
    const statusMap = {
      'PENDING': { text: 'Pending', color: '#ff9800' },
      'GENERATED': { text: 'Generated', color: '#2196f3' },
      'DELIVERED': { text: 'Delivered', color: '#4caf50' },
      'CHECKED_IN': { text: 'Checked In', color: '#9c27b0' },
      'EXPIRED': { text: 'Expired', color: '#9e9e9e' }
    };
    
    return statusMap[status] || { text: status, color: '#333' };
  };
  
  /**
   * Creates booking request from selected seats and show data
   * @param {Array} selectedSeats - Array of selected seat IDs
   * @param {Object} show - Show data
   * @param {Object} seatLayout - Screen layout data
   * @param {String} userId - User ID
   * @param {String} couponCode - Coupon code (optional)
   * @returns {Object} Booking request object
   */
  export const createBookingRequest = (selectedSeats, show, seatLayout, userId, couponCode = null) => {
    if (!selectedSeats || !show || !seatLayout) {
      return null;
    }
    
    // Create seat data
    const seats = selectedSeats.map(seatId => {
      const [row, column] = seatId.split('-').map(Number);
      let category = '';
      let price = 0;
      
      // Find category and price
      if (seatLayout.sections) {
        for (const section of seatLayout.sections) {
          const seat = section.seats?.find(s => s.row === row && s.column === column);
          if (seat) {
            category = section.categoryName;
            price = show.pricing[category]?.finalPrice || 0;
            break;
          }
        }
      }
      
      return {
        seatId,
        row,
        column,
        category,
        basePrice: price,
        finalPrice: price
      };
    });
    
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
      totalAmount: subtotal + convenienceFee,
      couponCode
    };
  };
  
  /**
   * Generates QR code data for ticket
   * @param {Object} booking - Booking data
   * @returns {String} QR code data
   */
  export const generateQRCodeData = (booking) => {
    if (!booking) return '';
    
    // Create a simple data string for QR code
    const qrData = {
      bookingNumber: booking.bookingNumber,
      showId: booking.showId,
      userId: booking.userId,
      seats: booking.seats?.map(seat => seat.seatId || seat.seatNumber).join(','),
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  };