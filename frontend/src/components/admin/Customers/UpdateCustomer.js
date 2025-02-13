import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UpdateCustomer({ customerId, handleClick }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
        },
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCustomerData = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/users/${customerId}`);
                if (!response.ok) throw new Error('Failed to fetch customer data');
                const data = await response.json();
                console.log(response);
                setFormData(data);
            } catch (error) {
                console.error('Error fetching customer data:', error);
            }
        };
        fetchCustomerData();
    }, [customerId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prevState) => ({
                ...prevState,
                [parent]: {
                    ...prevState[parent],
                    [child]: value,
                },
            }));
        } else {
            setFormData((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        try {
            const updatedData = { ...formData };
            delete updatedData.confirmPassword;
            await fetch(`http://localhost:8080/api/users/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });
            alert('Customer updated successfully');
            handleClick('customers');
        } catch (error) {
            console.error('Error updating customer:', error);
            alert('Update failed');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <h2 className="text-center text-3xl font-bold">Update Customer</h2>
            <div>
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                />
            </div>
            <h3>Address Details</h3>
            <div>
                <label htmlFor="street">Street Address</label>
                <input
                    id="street"
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="city">City</label>
                <input
                    id="city"
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="state">State</label>
                <input
                    id="state"
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="zipCode">ZIP Code</label>
                <input
                    id="zipCode"
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                />
            </div>
            <button type="submit">Update Customer</button>
        </form>
    );
}

export default UpdateCustomer;
