import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Building2, MonitorPlay, Calendar, BarChart3, Film, Users } from 'lucide-react';

const TheaterManagerHome = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Theaters',
      description: 'Manage your theaters and screen configurations',
      icon: Building2,
      link: '/manager/theaters',
      color: 'primary'
    },
    {
      title: 'Screen Setup',
      description: 'Design and configure theater screen layouts',
      icon: MonitorPlay,
      link: '/manager/screen-setup',
      color: 'success'
    },
    {
      title: 'Show Schedule',
      description: 'Manage movie show timings and pricing',
      icon: Calendar,
      link: '/manager/shows',
      color: 'info'
    },
    {
      title: 'Analytics',
      description: 'View theater performance and revenue analytics',
      icon: BarChart3,
      link: '/manager/analytics',
      color: 'warning'
    }
  ];

  const stats = [
    { title: 'Active Shows', value: '24', icon: Film, color: '#8884d8' },
    { title: 'Total Bookings', value: '1,234', icon: Users, color: '#82ca9d' }
  ];

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4">Theater Manager Dashboard</h2>
        </Col>
      </Row>

      <Row className="mb-4">
        {stats.map((stat, index) => (
          <Col key={index} sm={6} lg={3}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">{stat.title}</h6>
                    <h3 className="mb-0">{stat.value}</h3>
                  </div>
                  <div style={{ 
                    backgroundColor: `${stat.color}20`, 
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <stat.icon size={24} color={stat.color} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        {features.map((feature, index) => (
          <Col key={index} md={6} lg={3} className="mb-4">
            <Card 
              className="h-100 cursor-pointer"
              onClick={() => navigate(feature.link)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body>
                <div 
                  className={`d-flex align-items-center justify-content-center mb-3`}
                  style={{ 
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: `var(--bs-${feature.color})`,
                    color: 'white'
                  }}
                >
                  <feature.icon size={24} />
                </div>
                <Card.Title>{feature.title}</Card.Title>
                <Card.Text className="text-muted">
                  {feature.description}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default TheaterManagerHome;