// ShowController.java
package com.moviebuff.moviebuff_backend.controller.show;

import com.moviebuff.moviebuff_backend.dto.request.ShowRequest;
import com.moviebuff.moviebuff_backend.dto.response.ShowResponse;
import com.moviebuff.moviebuff_backend.service.show.IShowService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shows")
@CrossOrigin(origins = "*")
public class ShowController {

   @Autowired
   private IShowService showService;

   @PostMapping
//    @PreAuthorize("hasRole('THEATER_MANAGER')")
   public ResponseEntity<ShowResponse> createShow(@Valid @RequestBody ShowRequest request) {
       return ResponseEntity.ok(showService.createShow(request));
   }

   @PutMapping("/{id}")
//    @PreAuthorize("hasRole('THEATER_MANAGER')")
   public ResponseEntity<ShowResponse> updateShow(@PathVariable String id, @Valid @RequestBody ShowRequest request) {
       return ResponseEntity.ok(showService.updateShow(id, request));
   }

   @DeleteMapping("/{id}")
//    @PreAuthorize("hasRole('THEATER_MANAGER')")
   public ResponseEntity<Void> deleteShow(@PathVariable String id) {
       showService.deleteShow(id);
       return ResponseEntity.noContent().build();
   }

   @GetMapping("/{id}")
   public ResponseEntity<ShowResponse> getShow(@PathVariable String id) {
       return ResponseEntity.ok(showService.getShow(id));
   }

   // Update the existing endpoint to accept an optional parameter
@GetMapping("/theater/{theaterId}")
public ResponseEntity<List<ShowResponse>> getShowsByTheater(
        @PathVariable String theaterId,
        @RequestParam(defaultValue = "false") boolean includePastShows) {
    return ResponseEntity.ok(showService.getShowsByTheater(theaterId, includePastShows));
}
@GetMapping("/theater/{theaterId}/date/{date}")
public ResponseEntity<List<ShowResponse>> getShowsByTheaterAndDate(
        @PathVariable String theaterId,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return ResponseEntity.ok(showService.getShowsByTheaterAndDate(theaterId, date));
}

   @GetMapping("/movie/{movieId}")
   public ResponseEntity<List<ShowResponse>> getShowsByMovie(@PathVariable String movieId) {
       return ResponseEntity.ok(showService.getShowsByMovie(movieId));
   }

   @GetMapping("/theater/{theaterId}/screen/{screenNumber}")
   public ResponseEntity<List<ShowResponse>> getShowsByTheaterAndScreen(
           @PathVariable String theaterId,
           @PathVariable int screenNumber,
           @RequestParam LocalDateTime startTime,
           @RequestParam LocalDateTime endTime) {
       return ResponseEntity.ok(showService.getShowsByTheaterAndScreen(theaterId, screenNumber, startTime, endTime));
   }

   @PutMapping("/{showId}/status")
//    @PreAuthorize("hasRole('THEATER_MANAGER')")
   public ResponseEntity<Void> updateShowStatus(
           @PathVariable String showId,
           @RequestParam String status) {
       showService.updateShowStatus(showId, status);
       return ResponseEntity.ok().build();
   }

   @PutMapping("/{showId}/seats")
   public ResponseEntity<Void> updateSeatAvailability(
           @PathVariable String showId,
           @RequestBody List<String> seatIds,
           @RequestParam boolean available) {
       showService.updateSeatAvailability(showId, seatIds, available);
       return ResponseEntity.ok().build();
   }

   // Add these methods to the existing ShowController

@GetMapping("/date")
public ResponseEntity<List<ShowResponse>> getShowsByDate(
        @RequestParam String date,
        @RequestParam(required = false) String city) {
    return ResponseEntity.ok(showService.getShowsByDate(date, city));
}

@GetMapping("/movie/{movieId}/city/{city}/date/{date}")
public ResponseEntity<List<ShowResponse>> getShowsByMovieAndCity(
        @PathVariable String movieId,
        @PathVariable String city,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return ResponseEntity.ok(showService.getShowsByMovieAndCity(movieId, city, date));
}

@GetMapping("/{showId}/seat-availability")
public ResponseEntity<Map<String, Object>> getSeatAvailability(@PathVariable String showId) {
    return ResponseEntity.ok(showService.getSeatAvailability(showId));
}

@GetMapping("/analytics")
public ResponseEntity<Map<String, Object>> getShowAnalytics(
        @RequestParam(required = false) String startDate,
        @RequestParam(required = false) String endDate,
        @RequestParam(required = false) String movieId,
        @RequestParam(required = false) String theaterId) {
    return ResponseEntity.ok(showService.getShowAnalytics(startDate, endDate, movieId, theaterId));
}

@GetMapping("/trending")
public ResponseEntity<List<ShowResponse>> getTrendingShows(
        @RequestParam(required = false) String city,
        @RequestParam(defaultValue = "10") int limit) {
    return ResponseEntity.ok(showService.getTrendingShows(city, limit));
}

@PostMapping("/{showId}/refresh-status")
public ResponseEntity<Void> refreshShowStatus(@PathVariable String showId) {
    showService.refreshShowStatus(showId);
    return ResponseEntity.ok().build();
}
}