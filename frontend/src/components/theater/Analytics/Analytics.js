import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, DollarSign, Calendar, Film, Activity, Percent, Award } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getShowAnalytics } from '../../../redux/slices/showSlice';
import { getBookingAnalytics } from '../../../redux/slices/bookingSlice';
import { fetchTheaterStats } from '../../../redux/slices/theaterSlice';
import { getMovieStatistics } from '../../../redux/slices/movieSlice';
import { format, subDays } from 'date-fns';

const Analytics = () => {
  const dispatch = useDispatch();
  
  // Select data from Redux store
  const theater = useSelector(state => state.theater.currentTheater);
  const theaterStats = useSelector(state => state.theater.stats);
  const showAnalytics = useSelector(state => state.shows.analytics);
  const bookingAnalytics = useSelector(state => state.booking.analytics);
  const movieStats = useSelector(state => state.movies.statistics);
  const loading = useSelector(state => 
    state.theater.loading || 
    state.shows.isLoading || 
    state.booking.isLoading ||
    state.movies.isLoading
  );
  const error = useSelector(state => 
    state.theater.error || 
    state.shows.error || 
    state.booking.error ||
    state.movies.error
  );

  // Local state for date filters
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Fetch analytics data on component mount
  useEffect(() => {
    if (theater?.id) {
      dispatch(fetchTheaterStats(theater.id));
      
      dispatch(getShowAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        theaterId: theater.id
      }));
      
      dispatch(getBookingAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        theaterId: theater.id
      }));
      
      // If there's a current running movie, get its statistics
      if (showAnalytics?.topMovies && showAnalytics.topMovies.length > 0) {
        dispatch(getMovieStatistics(showAnalytics.topMovies[0].movieId));
      }
    }
  }, [dispatch, theater?.id, dateRange]);

  // Prepare data for charts
  const prepareData = () => {
    // Revenue data for line chart
    const dailyRevenue = bookingAnalytics?.revenueByDate || [];
    
    // Format daily revenue data for chart
    const formattedDailyRevenue = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue: Number(revenue)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Screen occupancy data for bar chart
    const screenOccupancy = showAnalytics?.occupancyByScreen || [];
    const formattedScreenOccupancy = Object.entries(screenOccupancy).map(([screen, rate]) => ({
      screen: `Screen ${screen}`,
      rate: Number(rate)
    }));

    // Show time performance data for bar chart
    const showPerformance = showAnalytics?.occupancyByTimeSlot || [];
    const formattedShowPerformance = Object.entries(showPerformance).map(([time, occupancy]) => ({
      name: time,
      occupancy: Number(occupancy)
    }));

    // Revenue by seat category data for pie chart
    const revenueByCategory = bookingAnalytics?.revenueBySeatType || [];
    const formattedRevenueByCategory = Object.entries(revenueByCategory).map(([category, value]) => ({
      name: category,
      value: Number(value)
    }));

    // Movie performance data
    const moviePerformance = showAnalytics?.topMovies || [];
    const formattedMoviePerformance = moviePerformance.map(movie => ({
      name: movie.title,
      revenue: movie.revenue || 0,
      occupancy: movie.occupancy || 0
    }));

    return {
      dailyRevenue: formattedDailyRevenue,
      occupancyRate: formattedScreenOccupancy,
      showPerformance: formattedShowPerformance,
      revenueByCategory: formattedRevenueByCategory,
      moviePerformance: formattedMoviePerformance
    };
  };

  // Define chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Stat card component
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="text-muted mb-1">{title}</h6>
            <h3 className="mb-0">{value}</h3>
          </div>
          <div style={{ 
            backgroundColor: `${color}20`, 
            padding: '12px',
            borderRadius: '8px'
          }}>
            <Icon size={24} color={color} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // Show loading spinner if data is being fetched
  if (loading && (!bookingAnalytics || !showAnalytics)) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Error loading analytics data: {error}
        </Alert>
      </Container>
    );
  }

  // Prepare chart data
  const chartData = prepareData();

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Container fluid className="py-4">
      <h3 className="mb-4">Theater Analytics Dashboard</h3>
      
      <Row className="mb-4 g-3">
        <Col sm={6} lg={3}>
          <StatCard
            title="Total Bookings"
            value={bookingAnalytics?.totalBookings?.toLocaleString() || "0"}
            icon={Users}
            color="#8884d8"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Average Occupancy"
            value={`${Math.round(showAnalytics?.averageOccupancy || 0)}%`}
            icon={Percent}
            color="#82ca9d"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(bookingAnalytics?.totalRevenue || 0)}
            icon={DollarSign}
            color="#ffc658"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Shows Today"
            value={theaterStats?.totalShowsToday || "0"}
            icon={Calendar}
            color="#ff7300"
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Daily Revenue</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chartData.dailyRevenue}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Revenue by Category</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.revenueByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {chartData.revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Screen Occupancy Rate</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.occupancyRate}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="screen" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="rate" name="Occupancy Rate" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Show Time Performance</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.showPerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="occupancy" name="Occupancy" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Movie Performance Section */}
      <h4 className="mb-3">Movie Performance</h4>
      <Row className="mb-4">
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Top Movies by Revenue</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.moviePerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Top Movies by Occupancy</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.moviePerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="occupancy" name="Occupancy" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Stats for Current Top Movie */}
      {movieStats && chartData.moviePerformance.length > 0 && (
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Detailed Stats for {chartData.moviePerformance[0]?.name || 'Top Movie'}</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col sm={6} md={3}>
                    <StatCard
                      title="Total Bookings"
                      value={movieStats.totalBookings?.toLocaleString() || "0"}
                      icon={Ticket}
                      color="#0088FE"
                    />
                  </Col>
                  <Col sm={6} md={3}>
                    <StatCard
                      title="Popularity Score"
                      value={movieStats.popularityScore?.toFixed(1) || "0"}
                      icon={Activity}
                      color="#00C49F"
                    />
                  </Col>
                  <Col sm={6} md={3}>
                    <StatCard
                      title="Avg. Rating"
                      value={movieStats.averageRating?.toFixed(1) || "0"}
                      icon={Award}
                      color="#FFBB28"
                    />
                  </Col>
                  <Col sm={6} md={3}>
                    <StatCard
                      title="Show Count"
                      value={movieStats.showCount?.toLocaleString() || "0"}
                      icon={Film}
                      color="#FF8042"
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

// Custom Ticket icon component
const Ticket = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || 24} 
      height={props.size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={props.color || "currentColor"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2 9c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v9.5c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V9Z" />
      <path d="M2 11h20" />
      <path d="m7 15 10-4" />
    </svg>
  );
};

export default Analytics;