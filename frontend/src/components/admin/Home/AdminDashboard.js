import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Spinner, 
  ProgressBar, 
  Badge,
  Alert
} from 'react-bootstrap';
import { 
  Film, 
  Users, 
  Ticket, 
  TrendingUp, 
  Calendar,
  Star, 
  DollarSign, 
  Activity, 
  BarChart2, 
  PieChart,
  Building,
  Percent,
  AlertOctagon,
  Award,
  UserPlus,
  Clock
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  getAllMovies, 
  getTrendingMovies, 
  getUpcomingMovies 
} from '../../../redux/slices/movieSlice';
import { fetchCustomers, fetchTheaterManagers } from '../../../redux/slices/userSlice';
import { getBookingAnalytics } from '../../../redux/slices/bookingSlice';
import { fetchTheaters } from '../../../redux/slices/theaterSlice';
import { getAllReviews } from '../../../redux/slices/reviewSlice';
import './AdminDashboard.css';

function AdminDashboard() {
  const dispatch = useDispatch();
  
  // Extract data from Redux state
  const { movies, trendingMovies, upcomingMovies, loading: moviesLoading } = useSelector(state => state.movies);
  const { customers, theaterManagers, loading: usersLoading } = useSelector(state => state.users);
  const { analytics: bookingAnalytics, isLoading: bookingLoading } = useSelector(state => state.booking);
  const { theaters, loading: theatersLoading } = useSelector(state => state.theater);
  const { reviews, loading: reviewsLoading } = useSelector(state => state.reviews);
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalTheaters: 0,
    upcomingMoviesCount: 0,
    recentBookings: 0,
    newUsers: 0,
    newMovies: 0,
    userGrowth: 0,
    revenueGrowth: 0,
    totalReviews: 0,
    occupancyRate: 0,
    activeTheaters: 0,
    averageRating: 0,
    highestRevenue: 0
  });
  
  // Top performing theaters based on bookings and revenue
  const [topTheaters, setTopTheaters] = useState([]);
  
  // Monthly revenue data
  const [revenueData, setRevenueData] = useState([]);
  
  // Booking statistics
  const [bookingStats, setBookingStats] = useState({
    totalConfirmed: 0,
    totalCancelled: 0,
    pendingRefunds: 0
  });

  // Date helpers
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const { startDate, endDate } = getDateRange();
        
        // Using Promise.all to fetch data in parallel
        await Promise.all([
          dispatch(getAllMovies({ filters: {} })),
          dispatch(getTrendingMovies(5)),
          dispatch(getUpcomingMovies(5)),
          dispatch(fetchCustomers()),
          dispatch(fetchTheaterManagers()),
          dispatch(fetchTheaters()),
          dispatch(getAllReviews()),
          dispatch(getBookingAnalytics({ 
            startDate,
            endDate
          }))
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  // Update stats when data changes
  useEffect(() => {
    if (!isLoading && !moviesLoading && !usersLoading && !bookingLoading && !theatersLoading && !reviewsLoading) {
      // Basic stats
      const totalMoviesCount = Array.isArray(movies) ? movies.length : 0;
      const totalUsersCount = (Array.isArray(customers) ? customers.length : 0) + 
                             (Array.isArray(theaterManagers) ? theaterManagers.length : 0);
      const totalBookingsCount = bookingAnalytics?.totalBookings || 0;
      const totalRevenueAmount = bookingAnalytics?.totalRevenue || 0;
      const totalTheatersCount = Array.isArray(theaters) ? theaters.length : 0;
      const upcomingMoviesCount = Array.isArray(upcomingMovies) ? upcomingMovies.length : 0;
      const totalReviewsCount = Array.isArray(reviews) ? reviews.length : 0;
      
      // Calculate active theaters
      const activeTheatersCount = Array.isArray(theaters) 
        ? theaters.filter(theater => theater.status === 'ACTIVE').length 
        : 0;
      
      // Calculate average rating from reviews
      let avgRating = 0;
      if (reviews && reviews.length > 0) {
        const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
        avgRating = sum / reviews.length;
      }
      
      // Recent booking count (last 30 days)
      const recentBookingsCount = bookingAnalytics?.recentBookings || 
                                bookingAnalytics?.lastMonthBookings || 0;
      
      // New users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newUsersLast30Days = customers?.filter(customer => {
        // If createdAt is available, use it, otherwise fallback to a rough estimate
        if (customer.createdAt) {
          const createdDate = new Date(customer.createdAt);
          return createdDate >= thirtyDaysAgo;
        }
        return false;
      }).length || 0;
      
      // Growth metrics (calculate or get from analytics)
      const newMoviesLast30Days = movies?.filter(movie => {
        if (!movie.releaseDate) return false;
        const releaseDate = new Date(movie.releaseDate);
        return releaseDate >= thirtyDaysAgo;
      }).length || 0;
      
      // Calculate user growth percentage from analytics or estimate
      const userGrowthPercent = bookingAnalytics?.userGrowth || 
                              (totalUsersCount > 0 ? (newUsersLast30Days / totalUsersCount) * 100 : 0);
      
      // Calculate revenue growth percentage from analytics or estimate
      const revenueGrowthPercent = bookingAnalytics?.revenueGrowth || 
                                  (bookingAnalytics?.lastMonthRevenue && bookingAnalytics?.previousMonthRevenue
                                    ? ((bookingAnalytics.lastMonthRevenue - bookingAnalytics.previousMonthRevenue) / 
                                      bookingAnalytics.previousMonthRevenue) * 100
                                    : 0);
      
      // Calculate occupancy rate
      const occupancyRate = bookingAnalytics?.averageOccupancyRate || 
                          (bookingAnalytics?.totalSeats && bookingAnalytics?.totalBookedSeats
                            ? (bookingAnalytics.totalBookedSeats / bookingAnalytics.totalSeats) * 100
                            : 0);
      
      // Find highest revenue movie or theater
      const highestRevenue = bookingAnalytics?.highestRevenue || 0;
      
      // Extract booking statistics
      const confirmedBookings = bookingAnalytics?.bookingsByStatus?.CONFIRMED || 0;
      const cancelledBookings = bookingAnalytics?.bookingsByStatus?.CANCELLED || 0;
      const pendingRefunds = bookingAnalytics?.pendingRefunds || 0;
      
      setStats({
        totalMovies: totalMoviesCount,
        totalUsers: totalUsersCount,
        totalBookings: totalBookingsCount,
        totalRevenue: totalRevenueAmount,
        totalTheaters: totalTheatersCount,
        upcomingMoviesCount: upcomingMoviesCount,
        recentBookings: recentBookingsCount,
        newUsers: newUsersLast30Days,
        newMovies: newMoviesLast30Days,
        userGrowth: parseFloat(userGrowthPercent.toFixed(1)),
        revenueGrowth: parseFloat(revenueGrowthPercent.toFixed(1)),
        totalReviews: totalReviewsCount,
        occupancyRate: parseFloat(occupancyRate.toFixed(1)),
        activeTheaters: activeTheatersCount,
        averageRating: parseFloat(avgRating.toFixed(1)),
        highestRevenue: highestRevenue
      });
      
      setBookingStats({
        totalConfirmed: confirmedBookings,
        totalCancelled: cancelledBookings,
        pendingRefunds: pendingRefunds
      });
      
      // Process monthly revenue data
      if (bookingAnalytics?.monthlyRevenue) {
        const months = Object.keys(bookingAnalytics.monthlyRevenue);
        const revenueDataFormatted = months.map(month => ({
          month,
          revenue: bookingAnalytics.monthlyRevenue[month]
        }));
        setRevenueData(revenueDataFormatted);
      }
      
      // Process theater data to get top performing theaters
      if (theaters?.length) {
        // Use actual data if available from backend
        if (bookingAnalytics?.topTheaters && bookingAnalytics.topTheaters.length > 0) {
          setTopTheaters(bookingAnalytics.topTheaters);
        } else {
          // Don't create simulated data if we don't have real data
          setTopTheaters([]);
        }
      }
    }
  }, [
    isLoading, 
    moviesLoading, 
    usersLoading, 
    bookingLoading, 
    theatersLoading, 
    reviewsLoading, 
    movies, 
    customers, 
    theaterManagers, 
    bookingAnalytics, 
    upcomingMovies, 
    theaters,
    reviews
  ]);

  // Stat card component
  const StatCard = ({ icon: Icon, title, value, variant, subValue, subText }) => (
    <Card className="h-100 stat-card">
      <Card.Body>
        <Row className="align-items-center">
          <Col xs={8}>
            <h6 className="text-muted mb-2">{title}</h6>
            <div className="d-flex align-items-baseline">
              <h3 className="mb-0">{value}</h3>
              {subValue && (
                <small className={`text-${parseFloat(subValue) >= 0 ? 'success' : 'danger'} ml-2 ms-2`}>
                  {parseFloat(subValue) >= 0 ? `+${subValue}` : subValue}
                  {subValue.toString().includes('%') ? '' : '%'}
                </small>
              )}
            </div>
            {subText && <small className="text-muted">{subText}</small>}
          </Col>
          <Col xs={4} className="text-end">
            <div className={`icon-box bg-${variant}-light text-${variant}`}>
              <Icon size={24} />
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  // Movie list item component
  const MovieListItem = ({ movie, index }) => (
    <div className="movie-list-item d-flex align-items-center py-2 border-bottom">
      <div className="rank-circle bg-primary-light text-primary">
        {index + 1}
      </div>
      <div className="ms-3 flex-grow-1">
        <h6 className="mb-0 text-truncate">{movie.title}</h6>
        <div className="d-flex align-items-center small">
          <Star size={14} className="text-warning" />
          <span className="ms-1 text-muted">
            {(movie.rating?.average || 0).toFixed(1)} ({movie.rating?.count || 0} reviews)
          </span>
        </div>
      </div>
      <Badge bg={
        movie.status === 'UPCOMING' ? 'warning' : 
        movie.status === 'RELEASED' ? 'success' : 
        'secondary'
      } className="movie-status">
        {movie.status ? movie.status.replace('_', ' ') : 'N/A'}
      </Badge>
    </div>
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${parseFloat(value).toFixed(1)}%`;
  };

  if (isLoading || moviesLoading || usersLoading || bookingLoading || theatersLoading || reviewsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center loading-container">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid className="p-0 admin-dashboard">
      <Row className="mb-4 mx-0">
        <Col className="px-4 py-3">
          <h2 className="page-title mb-1">Dashboard</h2>
          <p className="text-muted">Welcome back! Here's what's happening with MovieBuff today.</p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4 g-3 mx-0 px-3">
        <Col md={6} lg={3}>
          <StatCard 
            icon={Film} 
            title="Total Movies" 
            value={formatNumber(stats.totalMovies)}
            variant="primary"
            subValue={stats.newMovies > 0 ? `${stats.newMovies}` : '0'} 
            subText="new this month"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard 
            icon={Users} 
            title="Total Users" 
            value={formatNumber(stats.totalUsers)}
            variant="success"
            subValue={stats.userGrowth.toString()} 
            subText="vs last month"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard 
            icon={Ticket} 
            title="Total Bookings" 
            value={formatNumber(stats.totalBookings)}
            variant="info"
            subValue={stats.recentBookings > 0 ? `${Math.round((stats.recentBookings / stats.totalBookings) * 100)}%` : '0%'} 
            subText="recent bookings"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard 
            icon={DollarSign} 
            title="Total Revenue" 
            value={formatCurrency(stats.totalRevenue)}
            variant="warning"
            subValue={stats.revenueGrowth.toString()} 
            subText="vs last month"
          />
        </Col>
      </Row>

      {/* Additional Stats Row */}
      <Row className="mb-4 g-3 mx-0 px-3">
        <Col md={6} lg={3}>
          <StatCard 
            icon={Building} 
            title="Active Theaters" 
            value={formatNumber(stats.activeTheaters)}
            variant="secondary"
            subValue={stats.activeTheaters > 0 ? `${Math.round((stats.activeTheaters / stats.totalTheaters) * 100)}%` : '0%'} 
            subText="of total theaters"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard 
            icon={Star} 
            title="Total Reviews" 
            value={formatNumber(stats.totalReviews)}
            variant="danger"
            subValue={stats.averageRating.toString()} 
            subText="average rating"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard 
            icon={Percent} 
            title="Occupancy Rate" 
            value={formatPercent(stats.occupancyRate)}
            variant="primary"
            subText="average across all theaters"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard 
            icon={Calendar} 
            title="Upcoming Movies" 
            value={formatNumber(stats.upcomingMoviesCount)}
            variant="success"
            subText="scheduled for release"
          />
        </Col>
      </Row>

      {/* Content Section */}
      <Row className="g-3 mx-0 px-3">
        {/* Trending Movies */}
        <Col lg={4}>
          <Card className="h-100 dashboard-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Trending Movies</h5>
              <TrendingUp size={18} className="text-primary" />
            </Card.Header>
            <Card.Body className="p-0">
              {trendingMovies && trendingMovies.length > 0 ? (
                <div className="p-3">
                  {trendingMovies.map((movie, index) => (
                    <MovieListItem key={movie.id || index} movie={movie} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted mb-0">No trending movies found</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Upcoming Movies */}
        <Col lg={4}>
          <Card className="h-100 dashboard-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Upcoming Releases</h5>
              <Calendar size={18} className="text-primary" />
            </Card.Header>
            <Card.Body className="p-0">
              {upcomingMovies && upcomingMovies.length > 0 ? (
                <div className="p-3">
                  {upcomingMovies.map((movie, index) => (
                    <MovieListItem key={movie.id || index} movie={movie} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted mb-0">No upcoming movies found</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Booking Status */}
        <Col lg={4}>
          <Card className="h-100 dashboard-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Booking Status</h5>
              <Activity size={18} className="text-primary" />
            </Card.Header>
            <Card.Body>
              <div className="progress-stats">
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1 align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="status-indicator bg-success"></div>
                      <span className="fw-medium">Confirmed Bookings</span>
                    </div>
                    <span>{formatNumber(bookingStats.totalConfirmed)}</span>
                  </div>
                  <ProgressBar 
                    variant="success" 
                    now={Math.min(100, (bookingStats.totalConfirmed / (stats.totalBookings || 1)) * 100)} 
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1 align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="status-indicator bg-danger"></div>
                      <span className="fw-medium">Cancelled Bookings</span>
                    </div>
                    <span>{formatNumber(bookingStats.totalCancelled)}</span>
                  </div>
                  <ProgressBar 
                    variant="danger" 
                    now={Math.min(100, (bookingStats.totalCancelled / (stats.totalBookings || 1)) * 100)} 
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1 align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="status-indicator bg-warning"></div>
                      <span className="fw-medium">Pending Refunds</span>
                    </div>
                    <span>{formatNumber(bookingStats.pendingRefunds)}</span>
                  </div>
                  <ProgressBar 
                    variant="warning" 
                    now={Math.min(100, (bookingStats.pendingRefunds / (bookingStats.totalCancelled || 1)) * 100)} 
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1 align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="status-indicator bg-info"></div>
                      <span className="fw-medium">New User Registrations</span>
                    </div>
                    <span>{formatNumber(stats.newUsers)}</span>
                  </div>
                  <ProgressBar 
                    variant="info" 
                    now={Math.min(100, (stats.newUsers / (stats.totalUsers || 1)) * 100)} 
                  />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analytics Section */}
      <Row className="mt-4 g-3 mx-0 px-3 mb-4">
        {/* Monthly Revenue Chart */}
        <Col lg={6}>
          <Card className="dashboard-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Monthly Revenue</h5>
              <BarChart2 size={18} className="text-primary" />
            </Card.Header>
            <Card.Body className="d-flex justify-content-center align-items-center chart-placeholder">
              {revenueData.length > 0 ? (
                <div className="w-100 h-100">
                  <div className="revenue-chart">
                    {revenueData.map((item, index) => (
                      <div key={index} className="revenue-chart-column">
                        <div className="revenue-chart-bar" 
                             style={{ 
                               height: `${(item.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100}%` 
                             }}>
                          <span className="revenue-value">{formatCurrency(item.revenue)}</span>
                        </div>
                        <div className="revenue-month">{item.month}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted">
                  <BarChart2 size={48} className="mb-3" />
                  <p>Revenue analytics chart would be displayed here</p>
                  <small>No monthly revenue data available at this time</small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Top Performing Theaters */}
        {/* <Col lg={6}>
          <Card className="dashboard-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Top Performing Theaters</h5>
              <Award size={18} className="text-primary" />
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="theater-table mb-0">
                <thead>
                  <tr>
                    <th>Theater</th>
                    <th>City</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topTheaters.length > 0 ? (
                    topTheaters.map((theater, index) => (
                      <tr key={theater.id || index}>
                        <td>{theater.name}</td>
                        <td>{theater.city}</td>
                        <td>{formatNumber(theater.bookings)}</td>
                        <td>{formatCurrency(theater.revenue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">No theater data available</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col> */}
<Col lg={6}>
  <Card className="dashboard-card">
    <Card.Header className="d-flex justify-content-between align-items-center">
      <h5 className="mb-0">Top Performing Theaters</h5>
      <Award size={18} className="text-primary" />
    </Card.Header>
    <Card.Body className="p-0">
      <Table hover responsive className="theater-table mb-0">
        <thead>
          <tr>
            <th>Theater</th>
            <th>City</th>
            <th>Bookings</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {topTheaters.length > 0 ? (
            topTheaters.map((theater, index) => (
              <tr key={theater.id || index}>
                <td>{theater.name || 'N/A'}</td>
                <td>{theater.city || 'N/A'}</td>
                <td>{theater.bookings ? formatNumber(theater.bookings) : 'N/A'}</td>
                <td>{theater.revenue ? formatCurrency(theater.revenue) : 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">No theater data available</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card.Body>
  </Card>
</Col>
      </Row>

      {/* Activity Summary */}
      <Row className="mt-2 g-3 mx-0 px-3 mb-4">
        <Col>
          <Card className="dashboard-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Activity Summary</h5>
              <Clock size={18} className="text-primary" />
            </Card.Header>
            <Card.Body className="p-0">
              <div className="activity-summary">
                <div className="activity-item d-flex align-items-center">
                  <div className="activity-icon bg-success-light text-success">
                    <UserPlus size={18} />
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">New User Registrations</h6>
                    <p className="mb-0 text-muted">
                      {formatNumber(stats.newUsers)} new users registered in the last 30 days.
                    </p>
                  </div>
                </div>
                
                <div className="activity-item d-flex align-items-center">
                  <div className="activity-icon bg-primary-light text-primary">
                    <Film size={18} />
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">New Movies Added</h6>
                    <p className="mb-0 text-muted">
                      {formatNumber(stats.newMovies)} new movies added in the last 30 days.
                    </p>
                  </div>
                </div>
                
                <div className="activity-item d-flex align-items-center">
                  <div className="activity-icon bg-warning-light text-warning">
                    <Star size={18} />
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">Recent Reviews</h6>
                    <p className="mb-0 text-muted">
                      Average movie rating is {stats.averageRating} stars from {formatNumber(stats.totalReviews)} reviews.
                    </p>
                  </div>
                </div>
                
                <div className="activity-item d-flex align-items-center">
                  <div className="activity-icon bg-danger-light text-danger">
                    <AlertOctagon size={18} />
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">Pending Actions</h6>
                    <p className="mb-0 text-muted">
                      {formatNumber(bookingStats.pendingRefunds)} refunds pending processing.
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard;