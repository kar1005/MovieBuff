package com.moviebuff.moviebuff_backend.repository.interfaces.movie;

import com.moviebuff.moviebuff_backend.model.movie.Movie;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IMovieRepository extends MongoRepository<Movie, String> {
    // Basic queries
    Optional<Movie> findByTitle(String title);
    List<Movie> findByStatus(Movie.MovieStatus status);
    
    // Complex queries with aggregation
    @Query("{'releaseDate': {$gte: ?0}, 'status': ?1}")
    List<Movie> findUpcomingMovies(LocalDate date, Movie.MovieStatus status);
    
    @Query("{'genres': {$in: ?0}, 'status': 'NOW_SHOWING'}")
    List<Movie> findMoviesByGenres(List<String> genres);
    
    @Query("{'languages': {$in: ?0}, 'status': 'NOW_SHOWING'}")
    List<Movie> findMoviesByLanguages(List<String> languages);
    
    // Statistics and trending movies
    @Query(value = "{'status': 'NOW_SHOWING'}", sort = "{'statistics.popularityScore': -1}")
    List<Movie> findTrendingMovies();
    
    // Search functionality
    @Query("{'$or': [{'title': {$regex: ?0, $options: 'i'}}, {'description': {$regex: ?0, $options: 'i'}}]}")
    List<Movie> searchMovies(String keyword);
}