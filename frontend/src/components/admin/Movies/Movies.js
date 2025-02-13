// src/Customers/Customers.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './Customers.css'; 

function Movies({ handleClick }) {
    const [customers, setCustomers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomerData();
    }, []);

    const fetchCustomerData = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/movies/`, {
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
            const response = await fetch(`http://localhost:8080/api/movies/${id}`, {
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
                <button className="add-customer-btn" onClick={() =>handleClick('createcustomer')}>+ Add Customer</button>
            </div>
            <table className="table">
                <thead className="thead-black">
                    <tr>
                        <th scope="col">Title</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((c) => (
                        <tr key={c.id}>
                            <td>{c.title}</td>
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

export default Movies;
