// src/main/java/com/moviebuff/moviebuff_backend/repository/interfaces/theater/IShowRepository.java

package com.moviebuff.moviebuff_backend.repository.interfaces.theater;

import com.moviebuff.moviebuff_backend.model.show.Show;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IShowRepository extends MongoRepository<Show, String> {
    
    List<Show> findByTheaterId(String theaterId);
    
    @Query("{ 'theaterId': ?0, 'screenNumber': ?1, 'showTime': { $gte: ?2, $lt: ?3 } }")
    List<Show> findShowsByTheaterAndScreen(String theaterId, int screenNumber, LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("{ 'movieId': ?0, 'showTime': { $gte: ?1 } }")
    List<Show> findUpcomingShowsByMovie(String movieId, LocalDateTime currentTime);
}