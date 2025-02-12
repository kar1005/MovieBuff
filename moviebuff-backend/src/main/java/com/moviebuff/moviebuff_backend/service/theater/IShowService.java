// src/main/java/com/moviebuff/moviebuff_backend/service/theater/IShowService.java

package com.moviebuff.moviebuff_backend.service.theater;

import com.moviebuff.moviebuff_backend.dto.request.ShowRequest;
import com.moviebuff.moviebuff_backend.dto.response.ShowResponse;
import java.time.LocalDateTime;
import java.util.List;

public interface IShowService {
   ShowResponse createShow(ShowRequest request);
   ShowResponse updateShow(String id, ShowRequest request);
   void deleteShow(String id); 
   ShowResponse getShow(String id);
   List<ShowResponse> getShowsByTheater(String theaterId);
   List<ShowResponse> getShowsByMovie(String movieId);
   List<ShowResponse> getShowsByTheaterAndScreen(String theaterId, int screenNumber, LocalDateTime startTime, LocalDateTime endTime);
   void updateShowStatus(String showId, String status);
   void updateSeatAvailability(String showId, List<String> seatIds, boolean available);
}