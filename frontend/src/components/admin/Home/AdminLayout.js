// src/components/admin/layout/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Film, 
  Users, 
  MessageSquare, 
  Building2, 
  User,
  BarChart3,
  Menu,
  Image,
  CalendarCheck,
  X,
  ChevronRight,
  LogOut
} from 'lucide-react';
import './AdminLayout.css';
import logo from './MovieBuff_Logo.png';

const AdminLayout = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setShowSidebar(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'movies', label: 'Movies', icon: Film, path: '/admin/movies' },
    { id: 'actors', label: 'Actors', icon: Users, path: '/admin/actors' },
    { id: 'customers', label: 'Customers', icon: User, path: '/admin/customers' },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, path: '/admin/reviews' },
    { id: 'theater-managers', label: 'Theater Managers', icon: Building2, path: '/admin/theater-managers' },
    { id: 'stats', label: 'Statistics', icon: BarChart3, path: '/admin/stats' },
    { id: 'subscription', label: 'Subscription', icon: CalendarCheck, path: '/admin/subscription' },
    { id: 'slider', label: 'Slider', icon: Image, path: '/admin/slider' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleLogout = () => {
    // Add logout functionality here
    navigate('/logout');
    console.log('Logout clicked');
  };

  return (
    <div className="admin-layout">
      {/* Overlay for mobile */}
      {isMobile && showSidebar && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar ${showSidebar ? 'show' : 'hide'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src={logo} alt="MovieBuff Logo" className="logo" />
            <span className="logo-text">MovieBuff Admin</span>
          </div>
          {isMobile && (
            <button 
              className="close-btn"
              onClick={() => setShowSidebar(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-menu">
            {menuItems.map((item) => (
              <div 
                key={item.id}
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {isActive(item.path) && <ChevronRight className="active-indicator" size={16} />}
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="menu-item logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Navbar */}
        <header className="admin-header">
          <button 
            className="menu-toggle"
            onClick={() => setShowSidebar(!showSidebar)}
            aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
          >
            <Menu size={22} />
          </button>
          <div className="header-title">
  <h1>
    {location.pathname.includes('movies/edit/') 
      ? 'Edit Movie'
      : location.pathname.includes('movies/add') 
        ? 'Add Movie' : location.pathname.includes('actors/add') 
        ? 'Add Actors' : location.pathname.includes('actors/edit') 
        ? 'Edit Actors' 
        : location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
  </h1>
</div>
          <div className="header-actions">
            {/* Add header actions here if needed */}
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;