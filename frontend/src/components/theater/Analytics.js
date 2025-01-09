import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, DollarSign, Calendar } from 'lucide-react';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    dailyRevenue: [],
    occupancyRate: [],
    showPerformance: [],
    revenueByCategory: []
  });

  useEffect(() => {
    // Mock data - replace with API calls in production
    setAnalytics({
      dailyRevenue: [
        { date: '2025-01-01', revenue: 25000 },
        { date: '2025-01-02', revenue: 32000 },
        { date: '2025-01-03', revenue: 28000 },
        { date: '2025-01-04', revenue: 35000 },
      ],
      occupancyRate: [
        { screen: 'Screen 1', rate: 85 },
        { screen: 'Screen 2', rate: 72 },
        { screen: 'Screen 3', rate: 65 },
        { screen: 'Screen 4', rate: 78 },
      ],
      showPerformance: [
        { name: 'Morning', occupancy: 65 },
        { name: 'Matinee', occupancy: 75 },
        { name: 'Evening', occupancy: 90 },
        { name: 'Night', occupancy: 85 },
      ],
      revenueByCategory: [
        { name: 'PREMIUM', value: 45000 },
        { name: 'GOLD', value: 35000 },
        { name: 'SILVER', value: 20000 },
      ]
    });
  }, []);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="h-100">
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

  return (
    <Container fluid className="py-4">
      <Row className="mb-4 g-3">
        <Col sm={6} lg={3}>
          <StatCard
            title="Total Bookings"
            value="1,234"
            icon={Users}
            color="#8884d8"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Average Occupancy"
            value="78%"
            icon={TrendingUp}
            color="#82ca9d"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Today's Revenue"
            value="₹35,000"
            icon={DollarSign}
            color="#ffc658"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Shows Today"
            value="24"
            icon={Calendar}
            color="#ff7300"
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Daily Revenue</h5>
            </Card.Header>
            <Card.Body>
              <LineChart
                width={700}
                height={300}
                data={analytics.dailyRevenue}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
              </LineChart>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Revenue by Category</h5>
            </Card.Header>
            <Card.Body>
              <PieChart width={300} height={300}>
                <Pie
                  data={analytics.revenueByCategory}
                  cx={150}
                  cy={150}
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Screen Occupancy Rate</h5>
            </Card.Header>
            <Card.Body>
              <BarChart
                width={500}
                height={300}
                data={analytics.occupancyRate}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="screen" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rate" fill="#82ca9d" />
              </BarChart>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Show Time Performance</h5>
            </Card.Header>
            <Card.Body>
              <BarChart
                width={500}
                height={300}
                data={analytics.showPerformance}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupancy" fill="#8884d8" />
              </BarChart>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics;