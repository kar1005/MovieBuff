package com.moviebuff.moviebuff_backend.service.show;

import com.moviebuff.moviebuff_backend.dto.request.ShowRequest;
import com.moviebuff.moviebuff_backend.dto.response.ShowResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface IShowService {
   // Basic CRUD operations
   ShowResponse createShow(ShowRequest request);
   ShowResponse updateShow(String id, ShowRequest request);
   void deleteShow(String id); 
   ShowResponse getShow(String id);
   
   // Query operations
   List<ShowResponse> getShowsByTheater(String theaterId);
   List<ShowResponse> getShowsByMovie(String movieId);
   List<ShowResponse> getShowsByTheaterAndScreen(String theaterId, int screenNumber, LocalDateTime startTime, LocalDateTime endTime);
   List<ShowResponse> getShowsByDate(String date, String city);
   List<ShowResponse> getShowsByMovieAndCity(String movieId, String city);
   List<ShowResponse> getTrendingShows(String city, int limit);
   
   // Status and seat operations
   void updateShowStatus(String showId, String status);
   void updateSeatAvailability(String showId, List<String> seatIds, boolean available);
   Map<String, Object> getSeatAvailability(String showId);
   
   // Analytics
   Map<String, Object> getShowAnalytics(String startDate, String endDate, String movieId, String theaterId);
}