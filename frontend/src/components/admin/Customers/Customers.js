// src/pages/admin/Customers.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  InputGroup, 
  Spinner, 
  Alert,
  Pagination,
  Badge
} from 'react-bootstrap';
import { 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Mail,
  Phone,
  Eye
} from 'lucide-react';
import { 
  fetchCustomers, 
  setCustomerDetails,
  selectCustomers, 
  selectUserLoading, 
  selectUserError,
  selectCustomerDetails
} from '../../../redux/slices/userSlice';
import CustomerDetailsModal from './CustomerDetailsModal';
import './Customers.css';

const Customers = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const customers = useSelector(selectCustomers);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('username');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
    // State for customer details modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch customers on component mount
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);
  
  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
//   // State for customer details modal
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const customerDetails = useSelector(selectCustomerDetails);
  
  // Handle view customer details
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };
  
  // Filter and sort data
  const filteredCustomers = customers
    .filter(customer => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (customer.username || '').toLowerCase().includes(searchTermLower) ||
        (customer.email || '').toLowerCase().includes(searchTermLower) ||
        (customer.phoneNumber || '').toLowerCase().includes(searchTermLower)
      );
    })
    .sort((a, b) => {
      const fieldA = (a[sortField] || '').toLowerCase();
      const fieldB = (b[sortField] || '').toLowerCase();
      
      if (sortDirection === 'asc') {
        return fieldA.localeCompare(fieldB);
      } else {
        return fieldB.localeCompare(fieldA);
      }
    });
  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  
  // Generate pagination items
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    let items = [];
    
    // Add first page
    items.push(
      <Pagination.Item 
        key={1} 
        active={1 === currentPage}
        onClick={() => setCurrentPage(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Add ellipsis if necessary
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i !== 1 && i !== totalPages) {
        items.push(
          <Pagination.Item 
            key={i} 
            active={i === currentPage}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    }
    
    // Add ellipsis if necessary
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
    }
    
    // Add last page if more than one page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item 
          key={totalPages} 
          active={totalPages === currentPage}
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return (
      <Pagination className="mb-0">
        <Pagination.Prev 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };
  
  // Render sort indicator
  const renderSortIcon = (field) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? 
        <ChevronUp size={16} className="ms-1" /> : 
        <ChevronDown size={16} className="ms-1" />;
    }
    return null;
  };

  return (
    <Container fluid className="customers-page p-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="page-title">Customers</h2>
          <p className="text-muted">View registered customer accounts</p>
        </Col>
      </Row>
      
      {/* Error alert */}
      {error && (
        <Alert variant="danger" dismissible className="mb-4">
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={6} lg={4} className="mb-3 mb-md-0">
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0 ps-0 shadow-none"
                />
              </InputGroup>
            </Col>
            <Col md={6} lg={8} className="d-flex justify-content-md-end">
              <Button 
                variant="outline-secondary" 
                className="d-flex align-items-center"
                onClick={() => dispatch(fetchCustomers())}
              >
                <RefreshCw size={16} className="me-2" />
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body className="p-0">
          {loading && customers.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {searchTerm ? 'No customers match your search criteria.' : 'No customers found.'}
              </p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0 customer-table">
                <thead className="table-light">
                  <tr>
                    <th 
                      className="py-3 cursor-pointer"
                      onClick={() => handleSort('username')}
                    >
                      <div className="d-flex align-items-center">
                        Name {renderSortIcon('username')}
                      </div>
                    </th>
                    <th 
                      className="py-3 cursor-pointer"
                      onClick={() => handleSort('phoneNumber')}
                    >
                      <div className="d-flex align-items-center">
                        Phone Number {renderSortIcon('phoneNumber')}
                      </div>
                    </th>
                    <th 
                      className="py-3 cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      <div className="d-flex align-items-center">
                        Email {renderSortIcon('email')}
                      </div>
                    </th>
                    <th className="py-3 text-center">Status</th>
                    <th className="py-3 text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((customer) => (
                    <tr key={customer.id}>
                      <td className="py-3">
                        <div className="fw-medium">{customer.username || 'N/A'}</div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center">
                          <Phone size={16} className="text-muted me-2" />
                          {customer.phoneNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center text-truncate">
                          <Mail size={16} className="text-muted me-2" />
                          {customer.email || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <Badge bg="success" pill>Active</Badge>
                      </td>
                      <td className="py-3 text-end">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="action-btn"
                          title="View Customer Details"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <Eye size={16} className="text-primary" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        
        {!loading && filteredCustomers.length > 0 && (
          <Card.Footer className="d-flex flex-column flex-md-row justify-content-between align-items-center py-3 bg-white">
            <div className="text-muted mb-3 mb-md-0">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} customers
            </div>
            {renderPagination()}
          </Card.Footer>
        )}
      </Card>
      
      {/* Information Alert */}
      <Alert variant="info" className="mt-4 mb-0">
        <Alert.Heading className="h5">Admin Access Information</Alert.Heading>
        <p className="mb-0">
          As an administrator, you have view-only access to customer accounts. 
          For security and privacy reasons, customer account management is handled through 
          customer self-service or by customer support representatives.
        </p>
      </Alert>
      <CustomerDetailsModal 
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />
    </Container>
  );
};

export default Customers;