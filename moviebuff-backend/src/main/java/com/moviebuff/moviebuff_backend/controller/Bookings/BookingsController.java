package com.moviebuff.moviebuff_backend.controller.Bookings;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moviebuff.moviebuff_backend.model.booking.Booking;
import com.moviebuff.moviebuff_backend.repository.interfaces.bookings.IBookingsRepository;

@RestController
@RequestMapping("/api/booking")
public class BookingsController {
    @Autowired
    private IBookingsRepository bookingRepository;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBooking(){
        List<Booking> bookings = bookingRepository.findAll();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getbookingById(@PathVariable String id){
        return bookingRepository.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking){
        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(@PathVariable String id, @RequestBody Booking booking){
        if(!bookingRepository.existsById(id)){
            return ResponseEntity.notFound().build();
        }
        booking.setId(id);
        Booking updated = bookingRepository.save(booking);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable String id){
        bookingRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
