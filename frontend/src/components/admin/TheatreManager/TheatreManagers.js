// src/Customers/Customers.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './../Customers/Customers.css'; 

function TheatreManagers({ handleClick }) {
    const [customers, setCustomers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomerData();
    }, []);

    const fetchCustomerData = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/users/theatremanager`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            } else {
                console.error('Failed to fetch customers:', response.status);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const onDeleteClick = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/users/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                alert("Customer deleted successfully");
                fetchCustomerData(); // Refresh the list of customers
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
        }
    };

    return (
        <div className="customers-container">
            <div className="customers-header">
                <h2>Customers</h2>
                <button className="add-customer-btn" onClick={() =>handleClick('addtmanager')}>+ Add TheatreManager</button>
            </div>
            <table className="table">
                <thead className="thead-black">
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Phone Number</th>
                        <th scope="col">Email</th>
                        <th scope="col">Update</th>
                        <th scope="col">Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((c) => (
                        <tr key={c.id}>
                            <td>{c.username}</td>
                            <td>{c.phoneNumber}</td>
                            <td>{c.email}</td>
                            <td>
                                <button className="btn btn-primary" onClick={() => handleClick('updatecustomer',c.id)}>Update</button>
                            </td>
                            <td>
                                <button className="btn btn-danger" onClick={() => onDeleteClick(c.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TheatreManagers;
