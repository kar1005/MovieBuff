package com.moviebuff.moviebuff_backend.service.theater;

import com.moviebuff.moviebuff_backend.dto.request.ScreenDTO;
import com.moviebuff.moviebuff_backend.dto.request.TheaterRequest;
import com.moviebuff.moviebuff_backend.dto.response.TheaterResponse;
import com.moviebuff.moviebuff_backend.model.theater.Theater;

import java.util.List;
import java.util.Map;

public interface ITheaterService {
    // Get Theater
    List<TheaterResponse> getAllTheaters();
    TheaterResponse getTheater(String id);
    List<TheaterResponse> getTheatersByManagerId(String managerId);
    List<TheaterResponse> getTheatersByCity(String city);
    List<TheaterResponse> getTheatersNearby(Double latitude, Double longitude, Double radius);
    List<TheaterResponse> searchTheaters(String query, List<String> amenities, String city);
    // Get Screen
    List<ScreenDTO> getAllScreens(String theaterId);
    ScreenDTO getScreenByNumber(String theaterId, int screenNumber);
   
    // Analytics and Statistics
    Map<String, Object> getAnalytics(String theaterId, String startDate, String endDate, Integer screenNumber);
    TheaterResponse.TheaterStats getTheaterStats(String theaterId);

    // Post Theater
    TheaterResponse createTheater(TheaterRequest request);

    // Put Theater
    TheaterResponse updateTheater(String id, TheaterRequest request);
    // Put Screen
    TheaterResponse addScreen(String theaterId, ScreenDTO screenRequest);
    TheaterResponse updateScreen(String theaterId, int screenNumber, ScreenDTO screenRequest);

    // Delete
    void deleteTheater(String id);
    void deleteScreen(String theaterId, int screenNumber);
    
    //Patch
    TheaterResponse updateTheaterStatus(String id, Theater.TheaterStatus status);    
}