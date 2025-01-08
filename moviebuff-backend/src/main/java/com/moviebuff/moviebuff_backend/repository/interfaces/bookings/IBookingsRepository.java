package com.moviebuff.moviebuff_backend.repository.interfaces.bookings;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.moviebuff.moviebuff_backend.model.booking.Booking;


@Repository
public interface IBookingsRepository extends MongoRepository<Booking, String>{

    
} 
