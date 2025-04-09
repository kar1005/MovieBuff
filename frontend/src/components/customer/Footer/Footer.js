import React from 'react'
import {Container} from 'react-bootstrap'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <>
        <footer className="bg-dark text-light py-4 mt-5">
        <Container>
          <div className="row">
            <div className="col-md-4">
              <h5>MovieBuff</h5>
              <p>Your ultimate movie booking destination.</p>
            </div>
            <div className="col-md-4">
              <h5>Quick Links</h5>
              <ul className="list-unstyled">
                <li><Link to="/customer/movies" className="text-light">Movies</Link></li>
                <li><Link to="/customer/theaters" className="text-light">Theaters</Link></li>
                <li><Link to="/customer/booking/history" className="text-light">Booking History</Link></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5>Contact Us</h5>
              <p>Email: support@moviebuff.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12 text-center">
              <p className="mb-0">&copy; {new Date().getFullYear()} MovieBuff. All rights reserved.</p>
            </div>
          </div>
        </Container>
      </footer>
    </>
  )
}

export default Footer