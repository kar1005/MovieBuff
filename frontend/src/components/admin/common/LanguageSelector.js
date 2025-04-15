// src/components/common/LanguageSelector.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, Badge, Button, Dropdown, InputGroup, Spinner } from 'react-bootstrap';
import { Search, Plus, X, Check } from 'lucide-react';
import languageService from '../../../services/languageService';
import './LanguageSelector.css';

const LanguageSelector = ({ 
  selectedLanguages = [], 
  onChange, 
  isInvalid = false, 
  errorMessage = '' 
}) => {
  const [allLanguages, setAllLanguages] = useState([]);
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load languages on component mount
  useEffect(() => {
    loadLanguages();
  }, []);

  // Filter languages based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = allLanguages.filter(lang => 
        lang.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLanguages(filtered);
    } else {
      setFilteredLanguages(allLanguages);
    }
    
    // Show "Add new" option only if search term doesn't match any existing languages
    const matchesExisting = allLanguages.some(
      lang => lang.name.toLowerCase() === searchTerm.toLowerCase()
    );
    setShowAddNew(searchTerm.length >= 2 && !matchesExisting);
    
    // If adding a new language, update the newLanguage state
    if (searchTerm.length >= 2 && !matchesExisting) {
      setNewLanguage(searchTerm);
    }
  }, [searchTerm, allLanguages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadLanguages = async () => {
    setIsLoading(true);
    try {
      const languages = await languageService.getAllLanguages();
      setAllLanguages(languages);
      setFilteredLanguages(languages);
    } catch (error) {
      console.error('Failed to load languages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  const handleLanguageSelect = (language) => {
    const updatedSelection = [...selectedLanguages];
    const index = updatedSelection.findIndex(lang => lang.code === language.code);
    
    if (index === -1) {
      updatedSelection.push(language);
    } else {
      updatedSelection.splice(index, 1);
    }
    
    onChange(updatedSelection);
    setSearchTerm('');
    inputRef.current.focus();
  };

  const handleRemoveLanguage = (languageCode) => {
    const updatedSelection = selectedLanguages.filter(lang => lang.code !== languageCode);
    onChange(updatedSelection);
  };

  const handleAddNewLanguage = async () => {
    // Ensure there's a language name to add
    const languageName = newLanguage.trim() || searchTerm.trim();
    if (!languageName) return;
    
    try {
      setIsLoading(true);
      
      // Generate a code for the new language
      // Use first two letters and a random number to ensure uniqueness
      const tempCode = languageName.toLowerCase().replace(/\s+/g, '')
                        .substring(0, 2) + Math.floor(Math.random() * 10000);
      
      const newLang = { 
        name: languageName, 
        code: tempCode, 
        isCustom: true,
        nativeName: languageName
      };
      
      console.log('Adding new language:', newLang);
      
      // Add to database
      const savedLanguage = await languageService.addCustomLanguage(newLang);
      console.log('Language added successfully:', savedLanguage);
      
      // Update local state with the new language
      setAllLanguages(prev => [...prev, savedLanguage]);
      
      // Select the new language
      handleLanguageSelect(savedLanguage);
      
      // Reset states
      setNewLanguage('');
      setSearchTerm('');
      setShowAddNew(false);
    } catch (error) {
      console.error('Failed to add new language:', error);
      alert('Failed to add new language. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="language-selector-container" ref={dropdownRef}>
      <div className="selected-languages">
        {selectedLanguages.map(lang => (
          <Badge key={lang.code} bg="primary" className="language-badge">
            {lang.name}
            <X 
              size={14} 
              className="badge-remove-icon" 
              onClick={() => handleRemoveLanguage(lang.code)}
            />
          </Badge>
        ))}
      </div>
      
      <InputGroup className={isInvalid ? 'is-invalid' : ''}>
        <Form.Control
          ref={inputRef}
          type="text"
          placeholder="Search languages..."
          value={searchTerm}
          onChange={handleSearchChange}
          onClick={() => setShowDropdown(true)}
          isInvalid={isInvalid}
        />
        <InputGroup.Text>
          <Search size={16} />
        </InputGroup.Text>
      </InputGroup>
      
      {isInvalid && (
        <Form.Control.Feedback type="invalid">
          {errorMessage}
        </Form.Control.Feedback>
      )}

      {showDropdown && (
        <div className="language-dropdown">
          {isLoading ? (
            <div className="dropdown-loading">
              <Spinner animation="border" size="sm" /> Loading...
            </div>
          ) : (
            <>
              {filteredLanguages.length > 0 ? (
                <ul className="language-list">
                  {filteredLanguages.map(lang => (
                    <li 
                      key={lang.code} 
                      onClick={() => handleLanguageSelect(lang)}
                      className={selectedLanguages.some(l => l.code === lang.code) ? 'selected' : ''}
                    >
                      {lang.name}
                      {selectedLanguages.some(l => l.code === lang.code) && (
                        <Check size={16} className="selected-icon" />
                      )}
                      {lang.isCustom && <Badge bg="secondary" className="custom-badge">Custom</Badge>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-results">No matching languages found</div>
              )}
              
              {showAddNew && (
                <div className="add-new-language">
                  <InputGroup size="sm">
                    <Form.Control
                      type="text"
                      placeholder="New language name"
                      value={newLanguage || searchTerm}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewLanguage();
                        }
                      }}
                    />
                    <Button 
                      variant="outline-primary"
                      onClick={handleAddNewLanguage}
                      disabled={isLoading}
                    >
                      <Plus size={16} />
                    </Button>
                  </InputGroup>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;