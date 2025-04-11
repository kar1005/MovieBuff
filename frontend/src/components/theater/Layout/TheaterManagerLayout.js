// src/components/theater/Layout/TheaterManagerLayout.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  fetchManagerTheaters, 
  fetchTheaterStats 
} from '../../../redux/slices/theaterSlice';
import { checkSubscriptionStatus } from '../../../redux/slices/subscriptionSlice';
import { logout } from '../../../redux/slices/authSlice';
import { 
  LayoutDashboard, 
  Settings, 
  MonitorPlay, 
  BarChart3, 
  Calendar, 
  LogOut, 
  CreditCard,
  Menu,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import styles from './TheaterManagerLayout.module.css';
import logo from '../../../images/Logo/Logo.png';

const TheaterManagerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { currentTheater } = useSelector((state) => state.theater);
  const { isSubscriptionActive } = useSelector((state) => state.subscription);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Authentication and data fetching
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role !== 'THEATER_MANAGER') {
      navigate('/');
    } else {
      dispatch(fetchManagerTheaters(user.id));
      dispatch(checkSubscriptionStatus(user.id));
    }
  }, [isAuthenticated, user, dispatch, navigate]);

  // Fetch theater stats
  useEffect(() => {
    if (currentTheater) {
      dispatch(fetchTheaterStats(currentTheater.id));
    }
  }, [currentTheater, dispatch]);

  // Handle post-login subscription check
  useEffect(() => {
    const fromLogin = sessionStorage.getItem('fromLogin');
    
    if (fromLogin === 'true' && location.pathname === '/manager') {
      sessionStorage.removeItem('fromLogin');
      
      const checkSubscription = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (isSubscriptionActive === false) {
          navigate('/manager/subscription');
        }
      };
      
      checkSubscription();
    }
  }, [location.pathname, isSubscriptionActive, navigate]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector(`.${styles.sidebar}`);
      const menuButton = document.querySelector(`.${styles.menuButton}`);
      
      if (window.innerWidth < 992 && sidebarOpen && 
          sidebar && menuButton && 
          !sidebar.contains(event.target) && 
          !menuButton.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Auto-close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/manager',
      description: 'Overview of your theater'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      path: '/manager/theater/edit',
      description: 'Edit theater details'
    },
    { 
      id: 'screens', 
      label: 'Screens', 
      icon: MonitorPlay, 
      path: '/manager/theaters/:theaterId/screens',
      description: 'Manage theater screens'
    },
    { 
      id: 'schedule', 
      label: 'Schedule', 
      icon: Calendar, 
      path: '/manager/shows',
      description: 'Manage show times'
    },
    { 
      id: 'subscription', 
      label: 'Subscription', 
      icon: CreditCard, 
      path: '/manager/subscription/status',
      description: 'Manage your subscription'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      path: '/manager/analytics',
      description: 'View performance metrics'
    },
  ];

  const isActive = (path) => {
    if (path === '/manager') {
      return location.pathname === '/manager';
    }

    // Special case for screens path with variable theaterId
    if (path.includes(':theaterId/screens')) {
      return location.pathname.includes('/theaters/') && location.pathname.includes('/screens');
    }
  
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    if (path.includes(':theaterId') && currentTheater) {
      path = path.replace(':theaterId', currentTheater.id);
    }
    navigate(path);
    if (window.innerWidth < 992) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={styles.theaterManagerLayout}>
      {/* Top navbar */}
      <nav className={styles.topNavbar}>
        <div className={styles.navbarLeft}>
          <button 
            className={styles.menuButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          
          <div className={styles.logoContainer}>
            <img src={logo} alt="MovieBuff" className={styles.navbarLogo} />
            <h1 className={styles.navbarTitle}>Theater Manager</h1>
          </div>
        </div>
        
        <div className={styles.navbarRight}>
          {!isSubscriptionActive && (
            <Link to="/manager/subscription" className={styles.subscriptionAlert}>
              <AlertCircle size={20} />
            </Link>
          )}
          
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Subscription warning banner */}
      {!isSubscriptionActive && location.pathname !== '/manager/subscription' && (
        <div className={styles.subscriptionBanner}>
          <AlertCircle size={16} />
          <p>Your subscription is inactive. Some features may be limited.</p>
          <Link to="/manager/subscription">Renew Now</Link>
        </div>
      )}

      <div className={styles.layoutContainer}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
          <div className={styles.theaterInfo}>
            {currentTheater && (
              <>
                <div className={styles.theaterNameContainer}>
                  <h2 className={styles.theaterName}>{currentTheater.name}</h2>
                  <span className={`${styles.statusIndicator} ${currentTheater.status?.toLowerCase() === 'active' ? styles.active : styles.inactive}`}>
                    {currentTheater.status || 'UNKNOWN'}
                  </span>
                </div>
                <p className={styles.theaterLocation}>{currentTheater.location?.city}, {currentTheater.location?.state}</p>
              </>
            )}
          </div>
          
          <nav className={styles.sidebarNav}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <div className={styles.navIcon}>
                  <item.icon size={20} />
                </div>
                <div className={styles.navContent}>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navDescription}>{item.description}</span>
                </div>
                <ChevronRight size={16} className={styles.navArrow} />
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className={`${styles.mainContent} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default TheaterManagerLayout;