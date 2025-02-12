package com.moviebuff.moviebuff_backend.controller.theater;

import com.moviebuff.moviebuff_backend.dto.request.*;
import com.moviebuff.moviebuff_backend.dto.response.*;
import com.moviebuff.moviebuff_backend.model.theater.Theater;
import com.moviebuff.moviebuff_backend.service.theater.ITheaterService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
//GET
/**allTheater
 * theaterById
 * theaterByCity
 * theaterByLocation
 * 
 * allScreen
 * screenByScreenNumber
 * 
 */

//POST
/**createTheater
 * 
 * addScreen
 */

//PUT
/**updateTheater
 * 
 * update screenByScreenNumber
 */

//DELETE
/**
 * delete theater by id
 * 
 * delete screen by screen number
 */

@RestController
@RequestMapping("/api/theaters")
@CrossOrigin(origins = "*")
public class TheaterController {

    @Autowired
    private ITheaterService theaterService;

    /*********************************
     * POST
     *********************************/
    @PostMapping
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<TheaterResponse> createTheater(@Valid @RequestBody TheaterRequest request) {
        return ResponseEntity.ok(theaterService.createTheater(request));
    }

    //create screen
    @PostMapping("/{theaterId}/screens")
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<TheaterResponse> addScreen(
            @PathVariable String theaterId,
            @Valid @RequestBody ScreenDTO screenRequest) {
                System.out.println("----------------------------------------------------------------------");
                System.out.println("Data for the screen : " + screenRequest);
                System.out.println("----------------------------------------------------------------------");
        return ResponseEntity.ok(theaterService.addScreen(theaterId, screenRequest));
    }

    // Screen Layout Management
    @PostMapping("/{theaterId}/screens/{screenNumber}/layout")
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<ScreenLayoutResponseDTO> updateScreenLayout(
            @PathVariable String theaterId,
            @PathVariable int screenNumber,
            @Valid @RequestBody SeatLayoutRequest layoutRequest) {
        return ResponseEntity.ok(theaterService.updateScreenLayout(theaterId, screenNumber, layoutRequest));
    }


    /*********************************
     * GET
     *********************************/










    @PutMapping("/{id}")
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<TheaterResponse> updateTheater(
            @PathVariable String id,
            @Valid @RequestBody TheaterRequest request) {
        return ResponseEntity.ok(theaterService.updateTheater(id, request));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<Void> deleteTheater(@PathVariable String id) {
        theaterService.deleteTheater(id);
        return ResponseEntity.noContent().build();
    }

    // Theater Retrieval Operations
    @GetMapping("/{id}")
    public ResponseEntity<TheaterResponse> getTheater(@PathVariable String id) {
        return ResponseEntity.ok(theaterService.getTheater(id));
    }

    @GetMapping
    public ResponseEntity<List<TheaterResponse>> getTheaters(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double radius) {
        if (latitude != null && longitude != null && radius != null) {
            return ResponseEntity.ok(theaterService.getTheatersNearby(latitude, longitude, radius));
        } else if (city != null) {
            return ResponseEntity.ok(theaterService.getTheatersByCity(city));
        }
        return ResponseEntity.ok(theaterService.getAllTheaters());
    }

    // Theater Status Management
    @PatchMapping("/{id}/status")
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<TheaterResponse> updateTheaterStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> status) {
        return ResponseEntity
                .ok(theaterService.updateTheaterStatus(id, Theater.TheaterStatus.valueOf(status.get("status"))));
    }

    // Screen Management

    @PutMapping("/{theaterId}/screens/{screenNumber}")
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<TheaterResponse> updateScreen(
            @PathVariable String theaterId,
            @PathVariable int screenNumber,
            @Valid @RequestBody ScreenDTO screenRequest) {
        return ResponseEntity.ok(theaterService.updateScreen(theaterId, screenNumber, screenRequest));
    }

    @DeleteMapping("/{theaterId}/screens/{screenNumber}")
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<Void> deleteScreen(
            @PathVariable String theaterId,
            @PathVariable int screenNumber) {
        theaterService.deleteScreen(theaterId, screenNumber);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{theaterId}/screens")
    public ResponseEntity<List<ScreenResponseDTO>> getAllScreens(@PathVariable String theaterId) {
        return ResponseEntity.ok(theaterService.getAllScreens(theaterId));
    }

    @GetMapping("/{theaterId}/screens/{screenNumber}")
    public ResponseEntity<ScreenResponseDTO> getScreenByNumber(
            @PathVariable String theaterId,
            @PathVariable int screenNumber) {
        return ResponseEntity.ok(theaterService.getScreenByNumber(theaterId, screenNumber));
    }

    // Theater Analytics
    @GetMapping("/{theaterId}/analytics")
    // @PreAuthorize("hasRole('THEATER_MANAGER')")
    public ResponseEntity<Map<String, Object>> getTheaterAnalytics(
            @PathVariable String theaterId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) Integer screenNumber) {
        return ResponseEntity.ok(theaterService.getAnalytics(theaterId, startDate, endDate, screenNumber));
    }

    // Theater Statistics
    @GetMapping("/{theaterId}/stats")
    public ResponseEntity<TheaterResponse.TheaterStats> getTheaterStats(@PathVariable String theaterId) {
        return ResponseEntity.ok(theaterService.getTheaterStats(theaterId));
    }

    // Theater Search
    @GetMapping("/search")
    public ResponseEntity<List<TheaterResponse>> searchTheaters(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> amenities,
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(theaterService.searchTheaters(query, amenities, city));
    }
}