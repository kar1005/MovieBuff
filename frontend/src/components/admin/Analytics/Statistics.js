import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Table, Spinner, Nav, Alert, Badge } from 'react-bootstrap';
import { 
  BarChart2, 
  PieChart, 
  TrendingUp, 
  Users, 
  Ticket, 
  Film, 
  Calendar, 
  DollarSign,
  Map,
  Star,
  ArrowUp, 
  ArrowDown,
  Filter
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getMovieStatistics, 
  getTrendingMovies,
  getAllMovies 
} from '../../../redux/slices/movieSlice';
import { getBookingAnalytics } from '../../../redux/slices/bookingSlice';
import { getTheaterStats, fetchTheaters } from '../../../redux/slices/theaterSlice';
import { getUserReviews } from '../../../redux/slices/reviewSlice';
import { fetchCustomers } from '../../../redux/slices/userSlice';
import './Statistics.css';

function Statistics() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  // Get data from Redux store
  const { statistics: movieStats, trendingMovies, movies } = useSelector(state => state.movies);
  const { analytics: bookingAnalytics, isLoading: bookingLoading } = useSelector(state => state.booking);
  const { theaters, stats: theaterStats, loading: theaterLoading } = useSelector(state => state.theater);
  const { userReviews, movieReviews, reviewStats } = useSelector(state => state.reviews);
  const { customers } = useSelector(state => state.users);

  // Extract cities from theaters
  const cities = theaters && theaters.length > 0 
    ? ['All Cities', ...new Set(theaters.map(theater => theater.location?.city).filter(Boolean))]
    : ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          dispatch(getAllMovies({ filters: {} })),
          dispatch(getMovieStatistics('all')),
          dispatch(getTrendingMovies(10)),
          dispatch(getBookingAnalytics({
            startDate: getStartDateByTimeRange(timeRange),
            endDate: new Date().toISOString().split('T')[0],
            movieId: selectedMovie !== 'all' ? selectedMovie : undefined,
            theaterId: undefined
          })),
          dispatch(fetchTheaters()),
          dispatch(fetchCustomers())
        ]);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Filter data when filter options change
  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
        await dispatch(getBookingAnalytics({
          startDate: getStartDateByTimeRange(timeRange),
          endDate: new Date().toISOString().split('T')[0],
          movieId: selectedMovie !== 'all' ? selectedMovie : undefined,
          theaterId: undefined
        }));
      } catch (error) {
        console.error('Error fetching filtered data:', error);
      }
    };

    if (!isLoading) {
      fetchFilteredData();
    }
  }, [timeRange, selectedMovie, selectedCity, dispatch, isLoading]);

  // Helper function to get start date based on time range
  const getStartDateByTimeRange = (range) => {
    const now = new Date();
    switch (range) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
      case 'week':
        return new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
      case 'month':
      default:
        return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  // Calculate genre distribution from movies
  const calculateGenreDistribution = () => {
    if (!movies || !Array.isArray(movies)) return [];
    
    const genreCounts = {};
    let totalCount = 0;
    
    movies.forEach(movie => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          totalCount++;
        });
      }
    });
    
    // Convert to array and calculate percentages
    const distribution = Object.entries(genreCounts).map(([genre, count]) => ({
      genre,
      percentage: Math.round((count / totalCount) * 100)
    }));
    
    // Sort by percentage (descending)
    distribution.sort((a, b) => b.percentage - a.percentage);
    
    // Take top 5 and combine the rest as "Other"
    if (distribution.length > 5) {
      const topGenres = distribution.slice(0, 5);
      const otherPercentage = distribution.slice(5).reduce((sum, item) => sum + item.percentage, 0);
      return [...topGenres, { genre: 'Other', percentage: otherPercentage }];
    }
    
    return distribution;
  };

  // Get top performing movies based on bookings or revenue
  const getTopPerformingMovies = () => {
    if (!movies || !Array.isArray(movies) || !bookingAnalytics) return [];

    // In a real scenario, this would come from bookingAnalytics
    // For now, we're creating a simulation based on available movie data
    const topMovies = movies.slice(0, 5).map(movie => {
      const simulatedBookings = Math.floor(1000 + Math.random() * 5000);
      const simulatedRevenue = simulatedBookings * Math.floor(200 + Math.random() * 100);
      return {
        id: movie.id,
        title: movie.title,
        revenue: simulatedRevenue,
        bookings: simulatedBookings,
        rating: movie.rating?.average || (3 + Math.random() * 2).toFixed(1)
      };
    });

    // Sort by revenue (descending)
    return topMovies.sort((a, b) => b.revenue - a.revenue);
  };

  // Get top performing theaters
  const getTopPerformingTheaters = () => {
    if (!theaters || !Array.isArray(theaters)) return [];

    // Filter by selected city if needed
    const filteredTheaters = selectedCity !== 'all'
      ? theaters.filter(theater => theater.location?.city.toLowerCase() === selectedCity.toLowerCase())
      : theaters;

    // In a real scenario, this would come from analytics
    // For now, we're simulating based on available theater data
    const topTheaters = filteredTheaters.slice(0, 5).map(theater => {
      const simulatedOccupancy = Math.floor(70 + Math.random() * 30);
      const simulatedRevenue = simulatedOccupancy * 10000 + Math.random() * 500000;
      
      return {
        id: theater.id,
        name: theater.name,
        city: theater.location?.city || 'Unknown',
        revenue: Math.floor(simulatedRevenue),
        occupancy: simulatedOccupancy
      };
    });

    // Sort by revenue (descending)
    return topTheaters.sort((a, b) => b.revenue - a.revenue);
  };

  // Get occupancy rate data for charts
  const getOccupancyRateData = () => {
    // In a real scenario, this would come from bookingAnalytics
    // For now, use sample data
    const occupancyRate = {
      month: [85, 72, 90, 65, 78, 82, 67, 75, 88, 92, 84, 79, 
              81, 77, 83, 89, 75, 72, 78, 85, 90, 76, 82, 79, 
              84, 88, 75, 82, 78, 80],
      week: [82, 75, 89, 91, 72, 68, 86],
      day: [65, 70, 85, 92, 78, 73, 68, 75, 80, 85, 89, 90, 
            87, 82, 79, 75, 72, 68, 65, 70, 75, 79, 82, 84],
      year: Array.from({ length: 12 }, () => Math.floor(65 + Math.random() * 30))
    };

    return occupancyRate[timeRange] || occupancyRate.month;
  };

  // Get analytics stats for the current time period
  const getAnalyticsStats = () => {
    const defaultStats = {
      totalRevenue: bookingAnalytics?.totalRevenue || 12500000,
      totalBookings: bookingAnalytics?.totalBookings || 42500,
      avgOccupancy: bookingAnalytics?.averageOccupancy || 78,
      activeMovies: movies?.filter(m => m.status === 'NOW_SHOWING')?.length || 24,
      revenueGrowth: bookingAnalytics?.revenueGrowth || 12,
      bookingsGrowth: bookingAnalytics?.bookingsGrowth || 8,
      occupancyGrowth: bookingAnalytics?.occupancyGrowth || -3,
      newReleases: movies?.filter(m => {
        const releaseDate = new Date(m.releaseDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return releaseDate >= thirtyDaysAgo;
      })?.length || 5
    };

    return defaultStats;
  };

  const renderStatCard = (title, value, icon, trend = null, trendValue = null) => (
    <Card className="stat-card h-100">
      <Card.Body>
        <div className="d-flex justify-content-between">
          <div>
            <h6 className="text-muted mb-2">{title}</h6>
            <h3 className="mb-0">{value}</h3>
            {trend && (
              <small className={`d-flex align-items-center mt-2 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                {trend === 'up' ? <ArrowUp size={14} className="me-1" /> : <ArrowDown size={14} className="me-1" />}
                {trendValue}
              </small>
            )}
          </div>
          <div className="stat-icon">
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  if (isLoading || bookingLoading || theaterLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Get the analytics stats
  const stats = getAnalyticsStats();
  // Get genre distribution for pie chart
  const genreDistribution = calculateGenreDistribution();
  // Get top performing movies
  const topMovies = getTopPerformingMovies();
  // Get top performing theaters
  const topTheaters = getTopPerformingTheaters();

  return (
    <Container fluid className="statistics-page py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="page-title">Statistics & Analytics</h2>
          <p className="text-muted">Comprehensive insights into movies, bookings, and revenue</p>
        </Col>
        <Col xs="auto">
          <div className="d-flex gap-3">
            <Form.Select 
              size="sm" 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="filter-select"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
            </Form.Select>
            
            <Form.Select 
              size="sm" 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              className="filter-select"
            >
              {cities.map((city, index) => (
                <option key={index} value={city === 'All Cities' ? 'all' : city.toLowerCase()}>
                  {city}
                </option>
              ))}
            </Form.Select>
          </div>
        </Col>
      </Row>

      <Nav className="stats-nav mb-4" activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
        <Nav.Item>
          <Nav.Link eventKey="overview" className="d-flex align-items-center">
            <BarChart2 size={18} className="me-2" /> Overview
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="movies" className="d-flex align-items-center">
            <Film size={18} className="me-2" /> Movies
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="theaters" className="d-flex align-items-center">
            <Ticket size={18} className="me-2" /> Theaters
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="customers" className="d-flex align-items-center">
            <Users size={18} className="me-2" /> Customers
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="geography" className="d-flex align-items-center">
            <Map size={18} className="me-2" /> Geography
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'overview' && (
        <>
          <Row className="mb-4 g-3">
            <Col md={6} xl={3}>
              {renderStatCard(
                "Total Revenue", 
                formatCurrency(stats.totalRevenue),
                <DollarSign size={24} className="text-primary" />,
                stats.revenueGrowth >= 0 ? 'up' : 'down',
                `${Math.abs(stats.revenueGrowth)}% vs last period`
              )}
            </Col>
            <Col md={6} xl={3}>
              {renderStatCard(
                "Total Bookings", 
                formatNumber(stats.totalBookings),
                <Ticket size={24} className="text-success" />,
                stats.bookingsGrowth >= 0 ? 'up' : 'down',
                `${Math.abs(stats.bookingsGrowth)}% vs last period`
              )}
            </Col>
            <Col md={6} xl={3}>
              {renderStatCard(
                "Avg. Occupancy Rate", 
                `${stats.avgOccupancy}%`,
                <Users size={24} className="text-info" />,
                stats.occupancyGrowth >= 0 ? 'up' : 'down',
                `${Math.abs(stats.occupancyGrowth)}% vs last period`
              )}
            </Col>
            <Col md={6} xl={3}>
              {renderStatCard(
                "Active Movies", 
                stats.activeMovies.toString(),
                <Film size={24} className="text-warning" />,
                'up',
                `${stats.newReleases} new releases`
              )}
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col lg={8}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Revenue Trends</h5>
                  <Badge bg="primary">
                    {timeRange === 'day' ? 'Last 24 Hours' : 
                     timeRange === 'week' ? 'Last 7 Days' : 
                     timeRange === 'year' ? 'Last 12 Months' : 'Last 30 Days'}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <div className="chart-placeholder d-flex align-items-center justify-content-center">
                    <div className="text-center text-muted">
                      <BarChart2 size={48} className="mb-3" />
                      <p>Revenue chart would be displayed here</p>
                      <small>Shows daily revenue trends over selected time period</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Genre Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <div className="chart-placeholder d-flex align-items-center justify-content-center">
                    <div className="text-center text-muted">
                      <PieChart size={48} className="mb-3" />
                      <p>Genre distribution chart would be displayed here</p>
                    </div>
                  </div>
                  <div className="genre-legend mt-3">
                    {genreDistribution.map((item, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                          <span className={`legend-dot bg-${index % 5 === 0 ? 'primary' : index % 5 === 1 ? 'success' : index % 5 === 2 ? 'danger' : index % 5 === 3 ? 'warning' : 'info'}`}></span>
                          <span>{item.genre}</span>
                        </div>
                        <span className="fw-medium">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={6}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Top Performing Movies</h5>
                  <span className="text-muted small">by Revenue</span>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Movie</th>
                        <th>Revenue</th>
                        <th>Bookings</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMovies.length > 0 ? (
                        topMovies.map((movie, index) => (
                          <tr key={movie.id || index}>
                            <td>{movie.title}</td>
                            <td>{formatCurrency(movie.revenue)}</td>
                            <td>{formatNumber(movie.bookings)}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <Star size={14} className="text-warning me-1" />
                                <span>{Number(movie.rating).toFixed(1)}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-3">No movie data available</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Top Performing Theaters</h5>
                  <span className="text-muted small">by Revenue</span>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Theater</th>
                        <th>City</th>
                        <th>Revenue</th>
                        <th>Occupancy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTheaters.length > 0 ? (
                        topTheaters.map((theater, index) => (
                          <tr key={theater.id || index}>
                            <td>{theater.name}</td>
                            <td>{theater.city}</td>
                            <td>{formatCurrency(theater.revenue)}</td>
                            <td>{theater.occupancy}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-3">No theater data available</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'movies' && (
        <Row className="g-3">
          <Col md={12} lg={6}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Movie Performance</h5>
                <Badge bg="primary">By Bookings</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Movie</th>
                      <th>Release Date</th>
                      <th>Bookings</th>
                      <th>Rating</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies && movies.slice(0, 10).map((movie, index) => (
                      <tr key={movie.id || index}>
                        <td className="text-nowrap">{movie.title}</td>
                        <td>{new Date(movie.releaseDate).toLocaleDateString()}</td>
                        <td>{formatNumber(Math.floor(500 + Math.random() * 5000))}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Star size={14} className="text-warning me-1" />
                            <span>{(movie.rating?.average || (3 + Math.random() * 2)).toFixed(1)}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg={
                            movie.status === 'UPCOMING' ? 'warning' : 
                            movie.status === 'NOW_SHOWING' ? 'success' : 
                            'secondary'
                          }>
                            {movie.status ? movie.status.replace('_', ' ') : 'N/A'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={12} lg={6}>
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">Movie Rating Distribution</h5>
              </Card.Header>
              <Card.Body>
                <div className="chart-placeholder d-flex align-items-center justify-content-center">
                  <div className="text-center text-muted">
                    <PieChart size={48} className="mb-3" />
                    <p>Rating distribution chart would be displayed here</p>
                  </div>
                </div>
                <div className="rating-stats mt-4">
                  <Row>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{movies ? (movies.reduce((acc, movie) => acc + (movie.rating?.average || 0), 0) / Math.max(1, movies.length)).toFixed(1) : '0.0'}</h3>
                        <small className="text-muted">Average Rating</small>
                      </div>
                    </Col>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{movies ? formatNumber(movies.reduce((acc, movie) => acc + (movie.rating?.count || 0), 0)) : '0'}</h3>
                        <small className="text-muted">Total Reviews</small>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{movies ? formatNumber(movies.length) : '0'}</h3>
                        <small className="text-muted">Total Movies</small>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'theaters' && (
        <Row className="g-3">
          <Col md={12} lg={6}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Theaters Overview</h5>
                <Badge bg="primary">{selectedCity === 'all' ? 'All Cities' : selectedCity}</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Theater</th>
                      <th>City</th>
                      <th>Screens</th>
                      <th>Capacity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {theaters && theaters
                      .filter(theater => selectedCity === 'all' || theater.location?.city.toLowerCase() === selectedCity.toLowerCase())
                      .slice(0, 10)
                      .map((theater, index) => (
                        <tr key={theater.id || index}>
                          <td>{theater.name}</td>
                          <td>{theater.location?.city || 'Unknown'}</td>
                          <td>{theater.screens?.length || theater.totalScreens || 0}</td>
                          <td>{formatNumber(Math.floor(theater.screens?.reduce((acc, screen) => acc + (screen.totalSeats || 0), 0) || Math.random() * 500 + 100))}</td>
                          <td>
                            <Badge bg={theater.status === 'ACTIVE' ? 'success' : 'danger'}>
                              {theater.status || 'UNKNOWN'}
                            </Badge>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={12} lg={6}>
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">Theater Performance</h5>
              </Card.Header>
              <Card.Body>
                <div className="chart-placeholder d-flex align-items-center justify-content-center">
                  <div className="text-center text-muted">
                    <BarChart2 size={48} className="mb-3" />
                    <p>Theater performance chart would be displayed here</p>
                  </div>
                </div>
                <div className="theater-stats mt-4">
                  <Row>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{theaters ? formatNumber(theaters.length) : '0'}</h3>
                        <small className="text-muted">Total Theaters</small>
                      </div>
                    </Col>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{theaters ? formatNumber(theaters.reduce((acc, theater) => acc + (theater.totalScreens || 0), 0)) : '0'}</h3>
                        <small className="text-muted">Total Screens</small>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{theaters ? 
                          formatNumber(theaters.reduce((acc, theater) => {
                            const totalSeats = theater.screens?.reduce((seats, screen) => seats + (screen.totalSeats || 0), 0) || 0;
                            return acc + totalSeats;
                          }, 0)) : '0'}</h3>
                        <small className="text-muted">Total Capacity</small>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

{activeTab === 'customers' && (
        <Row className="g-3">
          <Col md={12} lg={6}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Customer Overview</h5>
                <Badge bg="primary">Registered Users</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Bookings</th>
                      <th>Total Spend</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers && customers.slice(0, 10).map((customer, index) => {
                      // Simulate customer booking and spending data
                      const simulatedBookings = Math.floor(1 + Math.random() * 15);
                      const simulatedSpend = simulatedBookings * Math.floor(200 + Math.random() * 300);
                      const simulatedDate = new Date();
                      simulatedDate.setDate(simulatedDate.getDate() - Math.floor(Math.random() * 365));
                      
                      return (
                        <tr key={customer.id || index}>
                          <td>{customer.username}</td>
                          <td>{customer.email}</td>
                          <td>{simulatedBookings}</td>
                          <td>{formatCurrency(simulatedSpend)}</td>
                          <td>{simulatedDate.toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                    {(!customers || customers.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center py-3">No customer data available</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={12} lg={6}>
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">Customer Insights</h5>
              </Card.Header>
              <Card.Body>
                <div className="chart-placeholder d-flex align-items-center justify-content-center">
                  <div className="text-center text-muted">
                    <Users size={48} className="mb-3" />
                    <p>Customer demographic chart would be displayed here</p>
                  </div>
                </div>
                <div className="customer-stats mt-4">
                  <Row>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{formatNumber(customers?.length || 0)}</h3>
                        <small className="text-muted">Total Customers</small>
                      </div>
                    </Col>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{formatNumber(Math.round((customers?.length || 0) * 0.75))}</h3>
                        <small className="text-muted">Active Users</small>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{formatCurrency((customers?.length || 0) * Math.floor(1500 + Math.random() * 1000))}</h3>
                        <small className="text-muted">Total Customer Spend</small>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'geography' && (
        <Row className="g-3">
          <Col md={12} lg={8}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">City-wise Distribution</h5>
                <Badge bg="primary">Booking Distribution</Badge>
              </Card.Header>
              <Card.Body>
                <div className="chart-placeholder d-flex align-items-center justify-content-center">
                  <div className="text-center text-muted">
                    <Map size={48} className="mb-3" />
                    <p>Geographic distribution map would be displayed here</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={12} lg={4}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Top Cities</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {theaters && Array.from(new Set(theaters.map(t => t.location?.city).filter(Boolean)))
                      .slice(0, 5)
                      .map((city, index) => {
                        // Simulate city data
                        const cityTheaters = theaters.filter(t => t.location?.city === city).length;
                        const simulatedBookings = Math.floor(cityTheaters * 1000 + Math.random() * 5000);
                        const simulatedRevenue = simulatedBookings * Math.floor(350 + Math.random() * 150);
                        
                        return (
                          <tr key={index}>
                            <td>{city}</td>
                            <td>{formatNumber(simulatedBookings)}</td>
                            <td>{formatCurrency(simulatedRevenue)}</td>
                          </tr>
                        );
                      })
                    }
                    {(!theaters || theaters.length === 0) && (
                      <tr>
                        <td colSpan="3" className="text-center py-3">No city data available</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
            <Card className="mt-3">
              <Card.Header>
                <h5 className="mb-0">Regional Distribution</h5>
              </Card.Header>
              <Card.Body>
                <div className="chart-placeholder d-flex align-items-center justify-content-center">
                  <div className="text-center text-muted">
                    <PieChart size={24} className="mb-2" />
                    <p className="small mb-0">Regional distribution chart would be displayed here</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Statistics;