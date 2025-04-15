import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Form, Button, Alert, Table } from 'react-bootstrap';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  BarChart2, Calendar, Users, TrendingUp, Film, Percent, 
  IndianRupee, Clock, Filter, Activity, Ticket, Award
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getShowAnalytics } from '../../../redux/slices/showSlice';
import { getBookingAnalytics } from '../../../redux/slices/bookingSlice';
import { fetchTheaterStats } from '../../../redux/slices/theaterSlice';
import { getMovieStatistics } from '../../../redux/slices/movieSlice';
import { format, subDays, parseISO } from 'date-fns';

const Analytics = () => {
  const dispatch = useDispatch();
  
  // Get theater data from redux store
  const theater = useSelector(state => state.theater.currentTheater);
  const showAnalytics = useSelector(state => state.shows.analytics);
  const bookingAnalytics = useSelector(state => state.booking.analytics);
  const theaterStats = useSelector(state => state.theater.stats);
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

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Fetch data on component mount
  useEffect(() => {
    if (theater?.id) {
      loadData();
    }
  }, [theater?.id]);

  // Function to load analytics data
  const loadData = () => {
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
  };

  // Handle date change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply date filter
  const handleFilterApply = () => {
    loadData();
  };

  // Format number as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare chart data
  const prepareChartData = () => {
    // Revenue data for line chart
    const dailyRevenue = bookingAnalytics?.revenueByDate || {};
    
    // Format daily revenue data for chart
    const formattedDailyRevenue = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue: Number(revenue)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Shows by day of week
    const showsByDayOfWeek = showAnalytics?.showsByDayOfWeek || {};
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayData = dayOrder.map(day => ({
      name: day,
      shows: showsByDayOfWeek[day] || 0
    }));

    // Shows by hour (time performance)
    const showsByHour = showAnalytics?.showsByHour || {};
    const hourData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      shows: showsByHour[i.toString()] || 0
    }));

    // Shows by status
    const showsByStatus = showAnalytics?.showsByStatus || {};
    const statusData = Object.entries(showsByStatus).map(([status, count]) => ({
      name: status,
      value: count
    }));

    // Movie performance data
    const moviePerformance = showAnalytics?.topMovies || [];
    const formattedMoviePerformance = moviePerformance.map(movie => ({
      name: movie.title || "Unknown",
      revenue: movie.revenue || 0,
      occupancy: movie.occupancy || 0
    }));

    // Screen occupancy data for bar chart
    const screenOccupancy = showAnalytics?.occupancyByScreen || {};
    const formattedScreenOccupancy = Object.entries(screenOccupancy).map(([screen, rate]) => ({
      screen: `Screen ${screen}`,
      rate: Number(rate)
    }));

    // Show time performance data for bar chart
    const showPerformance = showAnalytics?.occupancyByTimeSlot || {};
    const formattedShowPerformance = Object.entries(showPerformance).map(([time, occupancy]) => ({
      name: time,
      occupancy: Number(occupancy)
    }));

    // Revenue by seat category data for pie chart
    const revenueByCategory = bookingAnalytics?.revenueBySeatType || {};
    const formattedRevenueByCategory = Object.entries(revenueByCategory).map(([category, value]) => ({
      name: category,
      value: Number(value)
    }));

    // Popular shows
    const topShows = showAnalytics?.topPopularShows || [];
    console.log("topShows : ",JSON.stringify(topShows));
    
    return {
      dailyRevenue: formattedDailyRevenue,
      dayData,
      hourData,
      statusData,
      moviePerformance: formattedMoviePerformance,
      occupancyRate: formattedScreenOccupancy,
      showPerformance: formattedShowPerformance,
      revenueByCategory: formattedRevenueByCategory,
      topShows
    };
  };

  // Get chart data
  const chartData = prepareChartData();

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Stat card component
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between">
          <div>
            <p className="text-muted mb-1 small">{title}</p>
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

  // Loading state
  if (loading && (!showAnalytics || !bookingAnalytics)) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading analytics data...</span>
        </Spinner>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Analytics</Alert.Heading>
          <p className="mb-0">{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4">
      {/* Header with Date Filter */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-1">Analytics Dashboard</h2>
          <p className="text-muted mb-0">
            Performance insights for {theater?.name || 'your theater'}
          </p>
        </Col>
        <Col md="auto">
          <Card className="shadow-sm border-0">
            <Card.Body className="p-3">
              <Form className="d-flex align-items-center gap-2">
                <Form.Group>
                  <Form.Label className="mb-1 small">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="mb-1 small">End Date</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                  />
                </Form.Group>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleFilterApply}
                  style={{ marginTop: '24px' }}
                >
                  <Filter size={14} className="me-1" />
                  Apply
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row className="g-3 mb-4">
        <Col md={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(bookingAnalytics?.totalRevenue || 0)}
            icon={IndianRupee}
            color="#ffc658"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Total Bookings"
            value={(bookingAnalytics?.totalBookings || 0).toLocaleString()}
            icon={Ticket}
            color="#8884d8"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Average Occupancy"
            value={`${Math.round(showAnalytics?.averageOccupancyRate || 0)}%`}
            icon={Percent}
            color="#82ca9d"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatCard
            title="Total Shows"
            value={(showAnalytics?.totalShows || 0).toLocaleString()}
            icon={Film}
            color="#ff7300"
          />
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex align-items-center">
                <IndianRupee size={18} className="text-primary me-2" />
                <h5 className="mb-0">Daily Revenue</h5>
              </div>
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
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex align-items-center">
                <Activity size={18} className="text-primary me-2" />
                <h5 className="mb-0">Revenue by Category</h5>
              </div>
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

      {/* Show Time Analysis */}
      <h4 className="mb-3">
        <Clock size={18} className="text-primary me-2" />
        Show Time Analysis
      </h4>
      <Row className="g-3 mb-4">
        <Col lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Shows by Hour (Time Performance)</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.hourData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="shows" name="Number of Shows" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
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
                  <Bar dataKey="rate" name="Occupancy Rate" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Day-wise Analysis */}
      <h4 className="mb-3">
        <Calendar size={18} className="text-primary me-2" />
        Day-wise Analysis
      </h4>
      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Shows by Day of Week</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.dayData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="shows" name="Number of Shows" fill="#ffc658" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Shows by Status</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                  <Tooltip formatter={(value) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Movie Performance */}
      <h4 className="mb-3">
        <Film size={18} className="text-primary me-2" />
        Movie Performance
      </h4>
      <Row className="g-3 mb-4">
        <Col lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
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
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
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

      {/* Most Popular Shows */}
      <h4 className="mb-3">
        <TrendingUp size={18} className="text-primary me-2" />
        Most Popular Shows
      </h4>
      <Row className="g-3 mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover>
                  <thead className="bg-light">
                    <tr>
                      <th className="fw-semibold">Movie</th>
                      <th className="fw-semibold">Show Time</th>
                      {/* <th className="fw-semibold">Screen</th> */}
                      <th className="fw-semibold">Occupancy Rate</th>
                      <th className="fw-semibold">Popularity Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.topShows.length > 0 ? (
                      chartData.topShows.map((show, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <Film size={16} className="text-muted me-2" />
                              <span>{show.movieTitle || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>
                            {show.showTime 
                              ? format(parseISO(show.showTime), 'MMM dd, yyyy HH:mm') 
                              : 'Unknown'}
                          </td>
                          {/* <td>Screen {show.screenNumber || '?'}</td> */}
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2" style={{ width: '50px' }}>
                                <div className="progress" style={{ height: '6px' }}>
                                  <div 
                                    className="progress-bar bg-success" 
                                    style={{ width: `${show.occupancyRate || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span>{(show.occupancyRate || 0).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary bg-opacity-10 text-primary px-2">
                              {(show.popularityScore || 0).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-3">
                          No show data available for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Stats for Current Top Movie (if available) */}
      {movieStats && chartData.moviePerformance.length > 0 && (
        <>
          <h4 className="mb-3">
            <Award size={18} className="text-primary me-2" />
            Detailed Stats for {chartData.moviePerformance[0]?.name || 'Top Movie'}
          </h4>
          <Row className="g-3 mb-4">
            <Col sm={6} md={3}>
              <StatCard
                title="Total Bookings"
                value={(movieStats.totalBookings?.toLocaleString() || "0")}
                icon={Ticket}
                color="#0088FE"
              />
            </Col>
            <Col sm={6} md={3}>
              <StatCard
                title="Popularity Score"
                value={(movieStats.popularityScore?.toFixed(1) || "0")}
                icon={Activity}
                color="#00C49F"
              />
            </Col>
            <Col sm={6} md={3}>
              <StatCard
                title="Avg. Rating"
                value={(movieStats.averageRating?.toFixed(1) || "0")}
                icon={Award}
                color="#FFBB28"
              />
            </Col>
            <Col sm={6} md={3}>
              <StatCard
                title="Show Count"
                value={(movieStats.showCount?.toLocaleString() || "0")}
                icon={Film}
                color="#FF8042"
              />
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Analytics;