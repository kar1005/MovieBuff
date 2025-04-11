// src/components/customer/Layout/Header.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Navbar, Nav, NavDropdown, Form, InputGroup, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../redux/slices/authSlice';
import { searchMovies } from '../../../redux/slices/movieSlice';
import { searchActors } from '../../../redux/slices/actorSlice';
import { User, History, LogOut, Search, HelpCircle, MessageSquare, Ticket } from 'lucide-react';
import LocationSelector from '../Header/LocationSelector';
import Logo from '../../../images/Logo/Logo.png'; // Make sure this path is correct
import './Header.css';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState({
    movies: [],
    actors: [],
    loading: false
  });
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  const searchInputRef = useRef(null);
  const searchSuggestionsRef = useRef(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchSuggestions(false);
    }
  };
  
  // Function to handle search suggestion click
  const handleSuggestionClick = (type, id, name) => {
    if (type === 'movie') {
      navigate(`/movie/${id}`);
    } else if (type === 'actor') {
      navigate(`/actor/${id}`);
    }
    setSearchQuery(name);
    setShowSearchSuggestions(false);
  };
  
  // Click outside handler for search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchSuggestionsRef.current && 
        !searchSuggestionsRef.current.contains(event.target) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };
  
  // Function to fetch search suggestions
  const fetchSearchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query.trim() || query.length < 2) {
        setSearchSuggestions({
          movies: [],
          actors: [],
          loading: false
        });
        return;
      }
      
      setSearchSuggestions(prev => ({ ...prev, loading: true }));
      
      try {
        // Use the existing Redux thunks to fetch suggestions
        const movieResults = await dispatch(searchMovies({ query, limit: 5 })).unwrap();
        const actorResults = await dispatch(searchActors({ query, limit: 5 })).unwrap();
        
        setSearchSuggestions({
          movies: movieResults || [],
          actors: actorResults || [],
          loading: false
        });
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSearchSuggestions({
          movies: [],
          actors: [],
          loading: false
        });
      }
    }, 300),
    [dispatch]
  );
  
  // Function to handle search input change
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      fetchSearchSuggestions(value);
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  return (
    <header className="customer-header">
      <Navbar bg="dark" variant="dark" expand="lg" className="header-navbar">
        <Container>
          {/* Left section - Logo and brand */}
          <div className="header-left">
            <Link to="/" className="navbar-brand-link">
              <img src={Logo} className="navbar-logo" alt="MovieBuff Logo" />
              <Navbar.Brand>MovieBuff</Navbar.Brand>
            </Link>
            
            <Navbar.Toggle aria-controls="navbar-nav" />
            
            <Navbar.Collapse id="navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/customer/movies">Movies</Nav.Link>
                <Nav.Link as={Link} to="/customer/theaters">Theaters</Nav.Link>
                <Nav.Link as={Link} to="/customer/upcoming">Upcoming</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </div>
          
          {/* Middle section - Search */}
          <div className="header-search-container">
            <Form onSubmit={handleSearch} className="search-form">
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder="Search movies, actors & more"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.trim() && setShowSearchSuggestions(true)}
                  ref={searchInputRef}
                  className="search-input"
                />
                <InputGroup.Text className="search-button" onClick={handleSearch}>
                  <Search size={18} />
                </InputGroup.Text>
              </InputGroup>
              
              {/* Search suggestions dropdown */}
              {showSearchSuggestions && (
                <div className="search-suggestions" ref={searchSuggestionsRef}>
                  {searchSuggestions.loading ? (
                    <div className="search-suggestion-loading">
                      <div className="loading-spinner"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <>
                      {searchSuggestions.movies.length > 0 && (
                        <div className="search-suggestion-category">
                          <h6 className="search-suggestion-heading">Movies</h6>
                          {searchSuggestions.movies.map((movie, idx) => (
                            <div 
                              key={`movie-${idx}`} 
                              className="search-suggestion-item"
                              onClick={() => handleSuggestionClick('movie', movie.id, movie.title)}
                            >
                              <div className="search-suggestion-icon">
                                {movie.posterUrl ? (
                                  <img src={movie.posterUrl} alt={movie.title} className="search-suggestion-img" />
                                ) : (
                                  <div className="search-suggestion-placeholder">🎬</div>
                                )}
                              </div>
                              <div className="search-suggestion-info">
                                <div className="search-suggestion-title">{movie.title}</div>
                                <div className="search-suggestion-subtitle">
                                  {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ''} 
                                  {movie.languages && movie.languages.length > 0 && ` • ${movie.languages[0]}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {searchSuggestions.actors.length > 0 && (
                        <div className="search-suggestion-category">
                          <h6 className="search-suggestion-heading">Actors</h6>
                          {searchSuggestions.actors.map((actor, idx) => (
                            <div 
                              key={`actor-${idx}`} 
                              className="search-suggestion-item"
                              onClick={() => handleSuggestionClick('actor', actor.id, actor.name)}
                            >
                              <div className="search-suggestion-icon">
                                {actor.imageUrl ? (
                                  <img src={actor.imageUrl} alt={actor.name} className="search-suggestion-img" />
                                ) : (
                                  <div className="search-suggestion-placeholder">👤</div>
                                )}
                              </div>
                              <div className="search-suggestion-info">
                                <div className="search-suggestion-title">{actor.name}</div>
                                <div className="search-suggestion-subtitle">
                                  {actor.filmography && actor.filmography.length > 0 
                                    ? `Known for ${actor.filmography[0].movieTitle}` 
                                    : 'Actor'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {searchSuggestions.movies.length === 0 && searchSuggestions.actors.length === 0 && searchQuery.trim() && (
                        <div className="search-suggestion-empty">
                          No results found for "{searchQuery}"
                        </div>
                      )}
                      
                      <div className="search-suggestion-footer">
                        <button 
                          className="search-suggestion-view-all"
                          onClick={handleSearch}
                        >
                          View all results
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Form>
          </div>
          
          {/* Right section - Location selector and User profile */}
          <div className="header-right">
            <div className="nav-end-items">
              {/* Location selector */}
              <LocationSelector />
              
              {/* User dropdown */}
              {isAuthenticated ? (
                <NavDropdown 
                  title={
                    <span className="user-dropdown-toggle">
                      <User size={18} className="me-1" />
                      <span className="d-none d-sm-inline">{user?.username || 'Account'}</span>
                    </span>
                  } 
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/customer/profile">My Profile</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/customer/booking/history">
                    <Ticket size={16} className="me-2" /> My Bookings
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/reviews">
                    <MessageSquare size={16} className="me-2" /> My Reviews
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/help">
                    <HelpCircle size={16} className="me-2" /> Help & Support
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <LogOut size={16} className="me-2" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <div className="auth-links">
                  <Link to="/login" className="auth-link login-link">
                    Login
                  </Link>
                  <Link to="/register" className="auth-link register-link">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;