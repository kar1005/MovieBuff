import React, { useState, useRef, useEffect } from 'react';
import { Button, Overlay, Popover } from 'react-bootstrap';
import { Clock } from 'lucide-react';
import './TimePicker.css';
const TimePickerModal = ({ value, onChange, onClose }) => {
  // Parse initial value (format: "HH:MM")
  const initialTime = value ? value.split(':') : ['09', '00'];
  const [hour, setHour] = useState(parseInt(initialTime[0], 10));
  const [minute, setMinute] = useState(parseInt(initialTime[1], 10));
  const [period, setPeriod] = useState(hour >= 12 ? 'PM' : 'AM');

  // Generate hours (1-12 for display)
  const displayHours = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate minutes with 5-minute increments (00, 05, 10, ..., 55)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleHourChange = (newHour) => {
    setHour(newHour);
  };

  const handleMinuteChange = (newMinute) => {
    setMinute(newMinute);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    // Convert to 24-hour format for consistent storage
    let hour24 = hour;
    
    // Adjust hour based on period
    if (period === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (period === 'AM' && hour === 12) {
      hour24 = 0;
    }
    
    // Format as HH:MM
    const formattedTime = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(formattedTime);
    onClose();
  };

  return (
    <div className="time-picker-modal">
      <div className="time-picker-header">
        <h6 className="mb-2 text-center">SELECT TIME</h6>
      </div>
      
      <div className="time-picker-selectors d-flex align-items-center justify-content-center mb-3">
        {/* Hour selector */}
        <div className="hour-selector pe-1" style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {displayHours.map((h) => (
            <div 
              key={h} 
              className={`time-option ${h === hour ? 'selected' : ''}`}
              onClick={() => handleHourChange(h)}
            >
              {h.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
        
        <div className="separator">:</div>
        
        {/* Minute selector - Updated to 5-minute increments */}
        <div className="minute-selector ps-1" style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {minutes.map((m) => (
            <div 
              key={m} 
              className={`time-option ${m === minute ? 'selected' : ''}`}
              onClick={() => handleMinuteChange(m)}
            >
              {m.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
        
        {/* AM/PM selector */}
        <div className="period-selector ps-3">
          <div 
            className={`period-option ${period === 'AM' ? 'selected' : ''}`}
            onClick={() => handlePeriodChange('AM')}
          >
            AM
          </div>
          <div 
            className={`period-option ${period === 'PM' ? 'selected' : ''}`}
            onClick={() => handlePeriodChange('PM')}
          >
            PM
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="action-buttons d-flex justify-content-end">
        <Button variant="link" className="text-secondary" onClick={handleCancel}>CANCEL</Button>
        <Button variant="link" className="text-primary ms-3" onClick={handleConfirm}>OK</Button>
      </div>
    </div>
  );
};

const TimePicker = ({ value, onChange, name }) => {
  const [show, setShow] = useState(false);
  const target = useRef(null);
  
  // Format display time (convert from 24h to 12h format for display)
  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for display
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="time-picker">
      <Button
        ref={target}
        variant="outline-secondary"
        className="w-100 d-flex align-items-center justify-content-between"
        onClick={() => setShow(!show)}
      >
        <span>{value ? formatDisplayTime(value) : 'Select Time'}</span>
        <Clock size={16} />
      </Button>

      <Overlay
        show={show}
        target={target.current}
        placement="bottom"
        container={document.body}
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover id="time-picker-popover" style={{ maxWidth: 'none' }}>
          <Popover.Body className="p-0">
            <TimePickerModal
              value={value}
              onChange={onChange}
              onClose={() => setShow(false)}
              name={name}
            />
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  );
};

export default TimePicker;