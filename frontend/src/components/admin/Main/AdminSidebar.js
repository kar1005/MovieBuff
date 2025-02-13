import React,{useState} from 'react'
import AdminDashboard from './AdminDashboard';
import {Row} from 'react-bootstrap'
import './Dashboard.css';
import Customers from './../Customers/Customers'
import TheatreManagers from './../TheatreManager/TheatreManagers';
import AddCustomer from './../Customers/AddCustomer'
import UpdateCustomer from '../Customers/UpdateCustomer';
import AddTheatreManager from './../TheatreManager/AddTheatreManager'

function AdminSidebar() {
    const [selectedOption, setSelectedOption] = useState('dashboard');
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const handleOptionClick = (option, id = null) => {
        setSelectedOption(option);
        setSelectedCustomerId(id);
    };

  return (
    <>
        <div className="admin-page">
            <div className="admin-sidebar">
                <ul>
                    <li onClick={() => handleOptionClick('dashboard')}>Dashboard</li> 
                    <li onClick={() => handleOptionClick('menus')}>Movies</li>
                    <li onClick={() => handleOptionClick('customers')}>Customers</li>
                    <li onClick={() => handleOptionClick('theatremngr')}>Theatre Manager</li>
                </ul>
            </div>

            {/* Main Content */}
            <div className="content">
            <Row>
              <>
                {selectedOption === 'dashboard' && <AdminDashboard handleClick={handleOptionClick} />}
                {selectedOption === 'customers' && <Customers handleClick={handleOptionClick} />}
                {selectedOption === 'createcustomer' && <AddCustomer />}
                {selectedOption === 'updatecustomer' && <UpdateCustomer handleClick={handleOptionClick} customerId={selectedCustomerId} />}
                {selectedOption === 'theatremngr' && <TheatreManagers handleClick={handleOptionClick} />}
                {selectedOption === 'addtmanager' && <AddTheatreManager handleClick={handleOptionClick} />}
                {selectedOption === 'updatetmanager' && <UpdateCustomer handleClick={handleOptionClick} customerId={selectedCustomerId} />}
              </>
            </Row>
            </div>
        </div>
    </>
  )
}

export default AdminSidebar
