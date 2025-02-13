import React,{useState} from 'react'
import {Row} from 'react-bootstrap';

function AdminDashboard() {
    const [selectedOption, setSelectedOption] = useState('dashboard');
    const handleOptionClick = (option, id = null) => {
        setSelectedOption(option);
    };
  return (
    <>
        Admin Dashboard
    </>
  )
}

export default AdminDashboard
