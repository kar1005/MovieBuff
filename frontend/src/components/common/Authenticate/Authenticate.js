import React from 'react'
import Login from './../Login/Login'
import CustomerLayout from '../../customer/Layout/CustomerLayout'

function Authenticate() {
  return (
    <div>
      <CustomerLayout>
        <Login/>
      </CustomerLayout>
    </div>
  )
}

export default Authenticate
