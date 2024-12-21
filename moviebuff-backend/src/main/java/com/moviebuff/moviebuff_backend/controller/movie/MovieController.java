// src/main/java/com/moviebuff/controller/movie/MovieController.java
package com.moviebuff.moviebuff_backend.controller.movie;

import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.IMovieRepository;
import com.moviebuff.moviebuff_backend.repository.impl.movie.MovieRepositoryImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/movies")
public class MovieController {
    private static final Logger logger = LoggerFactory.getLogger(MovieController.class);

    @Autowired
    private IMovieRepository movieRepository;

    @Autowired
    private MovieRepositoryImpl movieRepositoryImpl;

    @GetMapping
    public ResponseEntity<List<Movie>> getAllMovies() {
        try {
            List<Movie> movies = movieRepository.findAll();
            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            logger.error("Error fetching all movies", e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable String id) {
        try {
            Movie movie = movieRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));
            return ResponseEntity.ok(movie);
        } catch (Exception e) {
            logger.error("Error fetching movie with id: " + id, e);
            throw e;
        }
    }

    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        try {
            // Set default values if not provided
            if (movie.getStatistics() == null) {
                movie.setStatistics(Movie.MovieStatistics.builder()
                        .totalBookings(0)
                        .revenue(0.0)
                        .popularityScore(0.0)
                        .build());
            }
            if (movie.getRating() == null) {
                movie.setRating(Movie.MovieRating.builder()
                        .average(0.0)
                        .count(0)
                        .build());
            }

            Movie savedMovie = movieRepository.save(movie);
            return ResponseEntity.ok(savedMovie);
        } catch (Exception e) {
            logger.error("Error creating movie", e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Movie> updateMovie(@PathVariable String id, @RequestBody Movie movie) {
        try {
            if (!movieRepository.existsById(id)) {
                throw new ResourceNotFoundException("Movie not found with id: " + id);
            }
            movie.setId(id);
            Movie updatedMovie = movieRepository.save(movie);
            return ResponseEntity.ok(updatedMovie);
        } catch (Exception e) {
            logger.error("Error updating movie with id: " + id, e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id) {
        try {
            if (!movieRepository.existsById(id)) {
                throw new ResourceNotFoundException("Movie not found with id: " + id);
            }
            movieRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting movie with id: " + id, e);
            throw e;
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Movie>> getTrendingMovies() {
        try {
            List<Movie> trendingMovies = movieRepository.findTrendingMovies();
            return ResponseEntity.ok(trendingMovies);
        } catch (Exception e) {
            logger.error("Error fetching trending movies", e);
            throw e;
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Movie>> getUpcomingMovies() {
        try {
            List<Movie> upcomingMovies = movieRepository.findUpcomingMovies(LocalDate.now(),
                    Movie.MovieStatus.UPCOMING);
            return ResponseEntity.ok(upcomingMovies);
        } catch (Exception e) {
            logger.error("Error fetching upcoming movies", e);
            throw e;
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Movie>> searchMovies(@RequestParam String keyword) {
        try {
            List<Movie> movies = movieRepository.searchMovies(keyword);
            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            logger.error("Error searching movies with keyword: " + keyword, e);
            throw e;
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<List<Movie>> filterMovies(
            @RequestParam(required = false) List<String> genres,
            @RequestParam(required = false) List<String> languages,
            @RequestParam(required = false) Movie.MovieStatus status,
            @RequestParam(required = false) Double minRating) {
        try {
            List<Movie> movies = movieRepositoryImpl.findMoviesByFilters(genres, languages, status, minRating);
            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            logger.error("Error filtering movies", e);
            throw e;
        }
    }

    @PutMapping("/{id}/statistics")
    public ResponseEntity<Void> updateMovieStatistics(
            @PathVariable String id,
            @RequestBody Movie.MovieStatistics statistics) {
        try {
            if (!movieRepository.existsById(id)) {
                throw new ResourceNotFoundException("Movie not found with id: " + id);
            }
            movieRepositoryImpl.updateMovieStatistics(id, statistics);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error updating movie statistics for id: " + id, e);
            throw e;
        }
    }

    @PutMapping("/{id}/rating")
    public ResponseEntity<Void> updateMovieRating(
            @PathVariable String id,
            @RequestBody Movie.MovieRating rating) {
        try {
            if (!movieRepository.existsById(id)) {
                throw new ResourceNotFoundException("Movie not found with id: " + id);
            }
            movieRepositoryImpl.updateMovieRating(id, rating);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error updating movie rating for id: " + id, e);
            throw e;
        }
    }
}