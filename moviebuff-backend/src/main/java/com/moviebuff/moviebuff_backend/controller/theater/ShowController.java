// ShowController.java
package com.moviebuff.moviebuff_backend.controller.theater;

import com.moviebuff.moviebuff_backend.dto.request.ShowRequest;
import com.moviebuff.moviebuff_backend.dto.response.ShowResponse;
import com.moviebuff.moviebuff_backend.service.theater.IShowService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

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

   @GetMapping("/theater/{theaterId}")
   public ResponseEntity<List<ShowResponse>> getShowsByTheater(@PathVariable String theaterId) {
       return ResponseEntity.ok(showService.getShowsByTheater(theaterId));
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
}