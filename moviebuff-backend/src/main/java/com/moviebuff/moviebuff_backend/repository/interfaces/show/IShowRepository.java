package com.moviebuff.moviebuff_backend.repository.interfaces.show;

import com.moviebuff.moviebuff_backend.model.show.Show;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IShowRepository extends MongoRepository<Show, String> {

    List<Show> findByTheaterIdAndShowTimeAfter(String theaterId, LocalDateTime time);
    List<Show> findByTheaterId(String theaterId);

    List<Show> findByMovieIdAndShowTimeAfter(String movieId, LocalDateTime time);
    
    List<Show> findByTheaterIdAndScreenNumberAndShowTimeBetween(
            String theaterId, Integer screenNumber, LocalDateTime startTime, LocalDateTime endTime);
    
    List<Show> findByShowTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("{'theaterId': {$in: ?0}, 'showTime': {$gte: ?1, $lte: ?2}}")
    List<Show> findByTheaterIdInAndShowTimeBetween(
            List<String> theaterIds, LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("{'movieId': ?0, 'theaterId': {$in: ?1}, 'showTime': {$gt: ?2}}")
    List<Show> findByMovieIdAndTheaterIdInAndShowTimeAfter(
            String movieId, List<String> theaterIds, LocalDateTime time);
    
    List<Show> findByTheaterIdInAndShowTimeAfter(List<String> theaterIds, LocalDateTime time);
    List<Show> findByTheaterIdAndScreenNumber(String theaterId, Integer screenNumber);

    List<Show> findByStatusNotIn(List<Show.ShowStatus> statuses);

    List<Show> findByShowTimeAfter(LocalDateTime time);

    // Add these methods to your IShowRepository interface
List<Show> findByTheaterIdAndShowTimeBetween(String theaterId, LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("{'status': ?0}")
    List<Show> findByStatus(Show.ShowStatus status);
    
    @Query("{'movieId': ?0, 'status': ?1}")
    List<Show> findByMovieIdAndStatus(String movieId, Show.ShowStatus status);
    
    @Query("{'theaterId': ?0, 'status': ?1}")
    List<Show> findByTheaterIdAndStatus(String theaterId, Show.ShowStatus status);
    
    @Query("{'popularityScore': {$gt: ?0}}")
    List<Show> findByPopularityScoreGreaterThan(Double score);
    
    @Query(value = "{'showTime': {$lt: ?0}, 'status': {$ne: 'FINISHED'}, 'status': {$ne: 'CANCELLED'}}")
    List<Show> findExpiredShows(LocalDateTime now);
    
    @Query(value = "{'theaterId': ?0, 'screenNumber': ?1}", count = true)
    long countByTheaterIdAndScreenNumber(String theaterId, Integer screenNumber);
    
    @Query(value = "{'movieId': ?0, 'showTime': {$gt: ?1}}", count = true)
    long countUpcomingShowsByMovie(String movieId, LocalDateTime now);
}