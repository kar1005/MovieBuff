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
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getMovieStatistics, 
  getTrendingMovies,
  getUpcomingMovies,
  getAllMovies 
} from '../../../redux/slices/movieSlice';
import { getBookingAnalytics } from '../../../redux/slices/bookingSlice';
import { getTheaterStats, fetchTheaters } from '../../../redux/slices/theaterSlice';
import { getUserReviews, getMovieReviews, getReviewStats } from '../../../redux/slices/reviewSlice';
import { fetchCustomers, fetchTheaterManagers } from '../../../redux/slices/userSlice';
import { getShowAnalytics, getTrendingShows } from '../../../redux/slices/showSlice';
import './Statistics.css';

function Statistics() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [error, setError] = useState(null);

  // Get data from Redux store
  const { movies, trendingMovies, upcomingMovies, statistics: movieStats } = useSelector(state => state.movies);
  const { analytics: bookingAnalytics, isLoading: bookingLoading } = useSelector(state => state.booking);
  const { theaters, stats: theaterStats, loading: theaterLoading } = useSelector(state => state.theater);
  const { userReviews, movieReviews, reviewStats } = useSelector(state => state.reviews);
  const { customers, theaterManagers } = useSelector(state => state.users);
  const { analytics: showAnalytics, trendingShows } = useSelector(state => state.shows);

  // Extract cities from theaters
  const cities = theaters && theaters.length > 0 
    ? ['All Cities', ...new Set(theaters.map(theater => theater.location?.city).filter(Boolean))]
    : ['All Cities'];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch basic data
        await Promise.all([
          dispatch(getAllMovies({ filters: {} })),
          dispatch(getTrendingMovies(10)),
          dispatch(getUpcomingMovies(10)),
          dispatch(fetchTheaters()),
          dispatch(fetchCustomers()),
          dispatch(fetchTheaterManagers()),
          dispatch(getShowAnalytics({
            startDate: getStartDateByTimeRange(timeRange),
            endDate: new Date().toISOString().split('T')[0]
          })),
          dispatch(getTrendingShows({ limit: 10 }))
        ]);
        
        // Fetch movie-specific data if a movie is selected
        if (selectedMovie !== 'all') {
          await dispatch(getMovieStatistics(selectedMovie));
          await dispatch(getMovieReviews({ movieId: selectedMovie }));
        } else {
          // Fetch overall statistics
          await dispatch(getMovieStatistics('all'));
        }
        
        // Fetch booking analytics with filters
        await dispatch(getBookingAnalytics({
          startDate: getStartDateByTimeRange(timeRange),
          endDate: new Date().toISOString().split('T')[0],
          movieId: selectedMovie !== 'all' ? selectedMovie : undefined,
          theaterId: undefined
        }));
        
        // Fetch review stats for trending movies
        if (movies && movies.length > 0) {
          await dispatch(getReviewStats(movies[0].id));
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load some statistics data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Filter data when filter options change
  useEffect(() => {
    if (!isLoading) {
      const applyFilters = async () => {
        try {
          await dispatch(getBookingAnalytics({
            startDate: getStartDateByTimeRange(timeRange),
            endDate: new Date().toISOString().split('T')[0],
            movieId: selectedMovie !== 'all' ? selectedMovie : undefined,
            theaterId: undefined
          }));
          
          await dispatch(getShowAnalytics({
            startDate: getStartDateByTimeRange(timeRange),
            endDate: new Date().toISOString().split('T')[0],
            movieId: selectedMovie !== 'all' ? selectedMovie : undefined,
            theaterId: undefined
          }));
          
          // If a movie is selected, fetch its specific statistics
          if (selectedMovie !== 'all') {
            await dispatch(getMovieStatistics(selectedMovie));
            await dispatch(getMovieReviews({ movieId: selectedMovie }));
          } else {
            await dispatch(getMovieStatistics('all'));
          }
          
          // If a city is selected, refetch theaters for that city
          if (selectedCity !== 'all') {
            // Use fetchTheaters with city filter if your API supports it
            // For now, the filtering is done client-side
          }
        } catch (err) {
          console.error('Error applying filters:', err);
          setError('Failed to apply filters. Please try again.');
        }
      };
      
      applyFilters();
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
    if (!movies || !Array.isArray(movies) || movies.length === 0) {
      return [];
    }
    
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

  // Get top performing movies based on bookings or revenue from booking analytics
  const getTopPerformingMovies = () => {
    if (!bookingAnalytics || !bookingAnalytics.topMovies || !Array.isArray(bookingAnalytics.topMovies)) {
      if (movies && movies.length > 0) {
        // Return movies if bookingAnalytics is not available
        return movies.slice(0, 5).map(movie => ({
          id: movie.id,
          title: movie.title,
          revenue: movie.statistics?.revenue || 0,
          bookings: movie.statistics?.totalBookings || 0,
          rating: movie.rating?.average || 0
        }));
      }
      return [];
    }
    
    return bookingAnalytics.topMovies;
  };

  // Get top performing theaters from booking analytics
  const getTopPerformingTheaters = () => {
    if (!bookingAnalytics || !bookingAnalytics.topTheaters || !Array.isArray(bookingAnalytics.topTheaters)) {
      if (theaters && theaters.length > 0) {
        // Filter theaters by selected city
        const filteredTheaters = selectedCity !== 'all'
          ? theaters.filter(theater => theater.location?.city.toLowerCase() === selectedCity.toLowerCase())
          : theaters;
          
        // Return theaters if bookingAnalytics is not available
        return filteredTheaters.slice(0, 5).map(theater => ({
          id: theater.id,
          name: theater.name,
          city: theater.location?.city || 'Unknown',
          revenue: theaterStats?.totalRevenue || 0,
          occupancy: theaterStats?.occupancyRate || 0
        }));
      }
      return [];
    }
    
    // Filter by city if needed
    if (selectedCity !== 'all' && bookingAnalytics.topTheaters) {
      return bookingAnalytics.topTheaters.filter(
        theater => theater.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }
    
    return bookingAnalytics.topTheaters;
  };

  // Get occupancy rate data for charts from show analytics
  const getOccupancyRateData = () => {
    if (!showAnalytics || !showAnalytics.occupancyTrend) {
      // Return placeholder data if not available
      return Array.from({ length: timeRange === 'week' ? 7 : 30 }, () => 
        Math.floor(65 + Math.random() * 30)
      );
    }
    
    return showAnalytics.occupancyTrend;
  };

  // Get analytics stats for the current time period from booking analytics
  const getAnalyticsStats = () => {
    const stats = {
      totalRevenue: bookingAnalytics?.totalRevenue || 0,
      totalBookings: bookingAnalytics?.totalBookings || 0,
      avgOccupancy: bookingAnalytics?.averageOccupancy || 0,
      activeMovies: movies?.filter(m => m.status === 'RELEASED')?.length || 0,
      revenueGrowth: bookingAnalytics?.revenueGrowth || 0,
      bookingsGrowth: bookingAnalytics?.bookingsGrowth || 0,
      occupancyGrowth: bookingAnalytics?.occupancyGrowth || 0,
      newReleases: upcomingMovies?.length || 0
    };

    return stats;
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
      {error && <Alert variant="danger">{error}</Alert>}
      
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
            
            <Form.Select
              size="sm"
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Movies</option>
              {movies && movies.map(movie => (
                <option key={movie.id} value={movie.id}>
                  {movie.title}
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
    {bookingAnalytics?.revenueTrend ? (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={bookingAnalytics.revenueTrend}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(tick) => {
              const date = new Date(tick);
              return timeRange === 'day' 
                ? `${date.getHours()}:00` 
                : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip 
            formatter={(value) => formatCurrency(value)}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              });
            }}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#8884d8" 
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    ) : (
      <div className="chart-placeholder d-flex align-items-center justify-content-center">
        <div className="text-center text-muted">
          <BarChart2 size={48} className="mb-3" />
          <p>No revenue trend data available</p>
        </div>
      </div>
    )}
  </Card.Body>
</Card>
            </Col>
            <Col lg={4}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Genre Distribution</h5>
                </Card.Header>
                <Card.Body>
                <ResponsiveContainer width="100%" height={230}>
  {genreDistribution.length > 0 ? (
    <RechartsPieChart>
      <Pie
        data={genreDistribution}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={2}
        dataKey="percentage"
        nameKey="genre"
        label={({genre, percentage}) => `${percentage}%`}
        labelLine={false}
      >
        {genreDistribution.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={
              index % 5 === 0 ? '#0d6efd' : 
              index % 5 === 1 ? '#198754' : 
              index % 5 === 2 ? '#dc3545' : 
              index % 5 === 3 ? '#ffc107' : 
              '#0dcaf0'
            } 
          />
        ))}
      </Pie>
      <Tooltip formatter={(value) => `${value}%`} />
    </RechartsPieChart>
  ) : (
    <div className="text-center text-muted">
      <PieChart size={48} className="mb-3" />
      <p>No genre distribution data available</p>
    </div>
  )}
</ResponsiveContainer>
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
                    {movies && movies.length > 0 ? (
                      movies.slice(0, 10).map((movie, index) => (
                        <tr key={movie.id || index}>
                          <td className="text-nowrap">{movie.title}</td>
                          <td>{new Date(movie.releaseDate).toLocaleDateString()}</td>
                          <td>{formatNumber(movie.statistics?.totalBookings || 0)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Star size={14} className="text-warning me-1" />
                              <span>{(movie.rating?.average || 0).toFixed(1)}</span>
                            </div>
                          </td>
                          <td>
                            <Badge bg={
                              movie.status === 'UPCOMING' ? 'warning' : 
                              movie.status === 'RELEASED' ? 'success' : 
                              'secondary'
                            }>
                              {movie.status || 'N/A'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-3">No movie data available</td>
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
                <h5 className="mb-0">Movie Rating Distribution</h5>
              </Card.Header>
              <Card.Body>
              <ResponsiveContainer width="100%" height={230}>
  {movieStats?.ratingDistribution ? (
    <BarChart
      data={Object.entries(movieStats.ratingDistribution).map(([rating, count]) => ({
        rating: Number(rating),
        count
      }))}
      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="rating" />
      <YAxis />
      <Tooltip 
        formatter={(value) => formatNumber(value)}
        labelFormatter={(label) => `${label} star${label !== '1' ? 's' : ''}`}
      />
      <Bar dataKey="count" name="Reviews" fill="#ffc107">
        {Object.entries(movieStats.ratingDistribution).map(([rating, count], index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={
              Number(rating) >= 4 ? '#198754' : 
              Number(rating) >= 3 ? '#0d6efd' : 
              Number(rating) >= 2 ? '#ffc107' : 
              '#dc3545'
            } 
          />
        ))}
      </Bar>
    </BarChart>
  ) : (
    <div className="text-center text-muted">
      <PieChart size={48} className="mb-3" />
      <p>No rating distribution data available</p>
    </div>
  )}
</ResponsiveContainer>
                <div className="rating-stats mt-4">
                  <Row>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">
                          {movies && movies.length > 0 
                            ? (movies.reduce((acc, movie) => acc + (movie.rating?.average || 0), 0) / Math.max(1, movies.length)).toFixed(1) 
                            : '0.0'}
                        </h3>
                        <small className="text-muted">Average Rating</small>
                      </div>
                    </Col>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">
                          {movies && movies.length > 0 
                            ? formatNumber(movies.reduce((acc, movie) => acc + (movie.rating?.count || 0), 0)) 
                            : '0'}
                        </h3>
                        <small className="text-muted">Total Reviews</small>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{formatNumber(movies?.length || 0)}</h3>
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
                    {theaters && theaters.length > 0 ? (
                      theaters
                        .filter(theater => selectedCity === 'all' || 
                                 (theater.location?.city && theater.location.city.toLowerCase() === selectedCity.toLowerCase()))
                        .slice(0, 10)
                        .map((theater, index) => (
                          <tr key={theater.id || index}>
                            <td>{theater.name}</td>
                            <td>{theater.location?.city || 'Unknown'}</td>
                            <td>{theater.screens?.length || theater.totalScreens || 0}</td>
                            <td>{formatNumber(theater.screens?.reduce((acc, screen) => acc + (screen.totalSeats || 0), 0) || 0)}</td>
                            <td>
                              <Badge bg={theater.status === 'ACTIVE' ? 'success' : 'danger'}>
                                {theater.status || 'UNKNOWN'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-3">No theater data available</td>
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
                <h5 className="mb-0">Theater Performance</h5>
              </Card.Header>
              <Card.Body>
              <ResponsiveContainer width="100%" height={230}>
  {bookingAnalytics?.theaterPerformance ? (
    <BarChart
      data={bookingAnalytics.theaterPerformance.slice(0, 5)}
      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      layout="vertical"
    >
      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
      <Tooltip formatter={(value) => formatCurrency(value)} />
      <Bar dataKey="revenue" name="Revenue" fill="#0d6efd" />
    </BarChart>
  ) : (
    <div className="text-center text-muted">
      <BarChart2 size={48} className="mb-3" />
      <p>Theater performance chart would be displayed here</p>
    </div>
  )}
</ResponsiveContainer>
                <div className="theater-stats mt-4">
                  <Row>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">{formatNumber(theaters?.length || 0)}</h3>
                        <small className="text-muted">Total Theaters</small>
                      </div>
                    </Col>
                    <Col xs={6} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">
                          {theaters && theaters.length > 0 
                            ? formatNumber(theaters.reduce((acc, theater) => acc + (theater.totalScreens || 0), 0)) 
                            : '0'}
                        </h3>
                        <small className="text-muted">Total Screens</small>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">
                          {theaters && theaters.length > 0 
                            ? formatNumber(theaters.reduce((acc, theater) => {
                                const totalSeats = theater.screens?.reduce((seats, screen) => 
                                  seats + (screen.totalSeats || 0), 0) || 0;
                                return acc + totalSeats;
                              }, 0)) 
                            : '0'}
                        </h3>
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
                    {customers && customers.length > 0 ? (
                      customers.slice(0, 10).map((customer, index) => {
                        // Try to get booking data from bookingAnalytics if available
                        const customerBookings = bookingAnalytics?.customerBookings?.find(
                          c => c.userId === customer.id
                        );
                        
                        return (
                          <tr key={customer.id || index}>
                            <td>{customer.username}</td>
                            <td>{customer.email}</td>
                            <td>{customerBookings?.bookingCount || 0}</td>
                            <td>{formatCurrency(customerBookings?.totalSpend || 0)}</td>
                            <td>{new Date().toLocaleDateString()}</td>
                          </tr>
                        );
                      })
                    ) : (
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
              <ResponsiveContainer width="100%" height={230}>
  {bookingAnalytics?.customerDemographics ? (
    <PieChart>
      <Pie
        data={bookingAnalytics.customerDemographics}
        cx="50%"
        cy="50%"
        outerRadius={80}
        dataKey="count"
        nameKey="segment"
        label={({segment, count, percent}) => `${segment} (${(percent * 100).toFixed(0)}%)`}
      >
        {bookingAnalytics.customerDemographics.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={
              index % 5 === 0 ? '#0d6efd' : 
              index % 5 === 1 ? '#198754' : 
              index % 5 === 2 ? '#dc3545' : 
              index % 5 === 3 ? '#ffc107' : 
              '#0dcaf0'
            } 
          />
        ))}
      </Pie>
      <Tooltip formatter={(value) => formatNumber(value)} />
      <Legend />
    </PieChart>
  ) : (
    <div className="text-center text-muted">
      <Users size={48} className="mb-3" />
      <p>Customer demographic chart would be displayed here</p>
    </div>
  )}
</ResponsiveContainer>
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
                        <h3 className="mb-1">
                          {bookingAnalytics?.activeUserCount 
                            ? formatNumber(bookingAnalytics.activeUserCount) 
                            : formatNumber(Math.round((customers?.length || 0) * 0.75))}
                        </h3>
                        <small className="text-muted">Active Users</small>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="text-center mb-3">
                        <h3 className="mb-1">
                          {bookingAnalytics?.totalCustomerSpend 
                            ? formatCurrency(bookingAnalytics.totalCustomerSpend)
                            : formatCurrency(stats.totalRevenue)}
                        </h3>
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
              <ResponsiveContainer width="100%" height={300}>
  {bookingAnalytics?.cityStats ? (
    <BarChart
      data={bookingAnalytics.cityStats.slice(0, 8)}
      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="city" tick={{ fontSize: 12 }} />
      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
      <Tooltip 
        formatter={(value, name) => {
          return name === 'revenue' ? formatCurrency(value) : formatNumber(value);
        }}
      />
      <Legend />
      <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="#8884d8" />
      <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#82ca9d" />
    </BarChart>
  ) : (
    <div className="text-center text-muted">
      <Map size={48} className="mb-3" />
      <p>Geographic distribution map would be displayed here</p>
    </div>
  )}
</ResponsiveContainer>
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
                    {bookingAnalytics?.cityStats ? (
                      bookingAnalytics.cityStats.slice(0, 5).map((city, index) => (
                        <tr key={index}>
                          <td>{city.city}</td>
                          <td>{formatNumber(city.bookings)}</td>
                          <td>{formatCurrency(city.revenue)}</td>
                        </tr>
                      ))
                    ) : theaters && theaters.length > 0 ? (
                      Array.from(new Set(theaters.map(t => t.location?.city).filter(Boolean)))
                        .slice(0, 5)
                        .map((city, index) => {
                          // Get city-specific data from bookingAnalytics if available
                          const cityTheaters = theaters.filter(t => t.location?.city === city).length;
                          const cityBookings = bookingAnalytics?.bookingsByCity?.[city] || 0;
                          const cityRevenue = bookingAnalytics?.revenueByCity?.[city] || 0;
                          
                          return (
                            <tr key={index}>
                              <td>{city}</td>
                              <td>{formatNumber(cityBookings)}</td>
                              <td>{formatCurrency(cityRevenue)}</td>
                            </tr>
                          );
                        })
                    ) : (
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
              <ResponsiveContainer width="100%" height={180}>
  {bookingAnalytics?.regionStats ? (
    <RechartsPieChart>
      <Pie
        data={bookingAnalytics.regionStats}
        cx="50%"
        cy="50%"
        outerRadius={70}
        dataKey="value"
        nameKey="region"
      >
        {bookingAnalytics.regionStats.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={
              index % 5 === 0 ? '#0d6efd' : 
              index % 5 === 1 ? '#198754' : 
              index % 5 === 2 ? '#dc3545' : 
              index % 5 === 3 ? '#ffc107' : 
              '#0dcaf0'
            } 
          />
        ))}
      </Pie>
      <Tooltip />
      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
    </RechartsPieChart>
  ) : (
    <div className="text-center text-muted">
      <PieChart size={24} className="mb-2" />
      <p className="small mb-0">Regional distribution chart would be displayed here</p>
    </div>
  )}
</ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Statistics;