package com.moviebuff.moviebuff_backend.repository;

import com.moviebuff.moviebuff_backend.model.movie.Movie;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MovieRepository extends MongoRepository<Movie, String> {
    
    // Find trending movies based on popularity score and recent release
    @Query("{ 'status': 'NOW_SHOWING', $or: [ " +
           "{ 'statistics.popularityScore': { $gt: 0 } }, " +
           "{ 'rating.average': { $gt: 3.5 } } " +
           "] }")
    List<Movie> findTrendingMovies();

    // Find upcoming movies
    List<Movie> findByReleaseDateAfterAndStatus(LocalDate date, Movie.MovieStatus status);
    default List<Movie> findUpcomingMovies(LocalDate date, Movie.MovieStatus status) {
        return findByReleaseDateAfterAndStatus(date, status);
    }

    // Find by actor
    @Query("{ 'cast.actorId': ?0 }")
    List<Movie> findByActorId(String actorId);

    // Find by various filters
    Page<Movie> findByLanguagesInAndGenresInAndStatus(
        List<String> languages, 
        List<String> genres, 
        Movie.MovieStatus status, 
        Pageable pageable
    );

    // Search movies by title or description
    @Query("{ $or: [ " +
           "{ 'title': { $regex: ?0, $options: 'i' } }, " +
           "{ 'description': { $regex: ?0, $options: 'i' } } " +
           "] }")
    List<Movie> findByTitleOrDescriptionRegex(String keyword);

    // Find by experience type
    List<Movie> findByExperienceIn(List<String> experience);

    // Find movies with minimum rating
    @Query("{ 'rating.average': { $gte: ?0 } }")
    List<Movie> findByMinimumRating(Double minRating);

    // Get movies between dates
    List<Movie> findByReleaseDateBetween(LocalDate startDate, LocalDate endDate);

    // Count movies by status
    long countByStatus(Movie.MovieStatus status);

    // Check if movie exists by title and languages (for duplicates)
    boolean existsByTitleAndLanguagesIn(String title, List<String> languages);

    // Find movies by multiple genres
    @Query("{ 'genres': { $all: ?0 } }")
    List<Movie> findByAllGenres(List<String> genres);

    // Custom update queries
    @Query("{ '$set': { 'statistics': ?1 } }")
    void updateStatistics(String id, Movie.MovieStatistics statistics);

    @Query("{ '$set': { 'rating': ?1 } }")
    void updateRating(String id, Movie.MovieRating rating);
}
