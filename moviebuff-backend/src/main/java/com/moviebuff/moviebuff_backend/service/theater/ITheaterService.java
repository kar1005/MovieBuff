package com.moviebuff.moviebuff_backend.service.theater;

import com.moviebuff.moviebuff_backend.dto.request.ScreenDTO;
import com.moviebuff.moviebuff_backend.dto.request.SeatLayoutRequest;
import com.moviebuff.moviebuff_backend.dto.request.TheaterRequest;
import com.moviebuff.moviebuff_backend.dto.response.ScreenLayoutResponseDTO;
import com.moviebuff.moviebuff_backend.dto.response.ScreenResponseDTO;
import com.moviebuff.moviebuff_backend.dto.response.TheaterResponse;
import com.moviebuff.moviebuff_backend.model.theater.Theater;

import java.util.List;
import java.util.Map;

public interface ITheaterService {
    // Basic Theater CRUD Operations
    TheaterResponse createTheater(TheaterRequest request);
    TheaterResponse updateTheater(String id, TheaterRequest request);
    void deleteTheater(String id);
    TheaterResponse getTheater(String id);
    
    // Theater Listing and Search Operations
    List<TheaterResponse> getAllTheaters();
    List<TheaterResponse> getTheatersByCity(String city);
    List<TheaterResponse> getTheatersNearby(Double latitude, Double longitude, Double radius);
    List<TheaterResponse> searchTheaters(String query, List<String> amenities, String city);
    List<TheaterResponse> getTheatersByManagerId(String managerId);

    // Theater Status Management
    TheaterResponse updateTheaterStatus(String id, Theater.TheaterStatus status);
    
    // Screen Management Operations
    TheaterResponse addScreen(String theaterId, ScreenDTO screenRequest);
    TheaterResponse updateScreen(String theaterId, int screenNumber, ScreenDTO screenRequest);
    void deleteScreen(String theaterId, int screenNumber);
    List<ScreenResponseDTO> getAllScreens(String theaterId);
    ScreenResponseDTO getScreenByNumber(String theaterId, int screenNumber);
    
    // Screen Layout Management
    ScreenLayoutResponseDTO updateScreenLayout(String theaterId, int screenNumber, SeatLayoutRequest layoutRequest);
    
    // Analytics and Statistics
    Map<String, Object> getAnalytics(String theaterId, String startDate, String endDate, Integer screenNumber);
    TheaterResponse.TheaterStats getTheaterStats(String theaterId);
}