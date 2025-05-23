// src/main/java/com/moviebuff/controller/movie/MovieController.java
package com.moviebuff.moviebuff_backend.controller.movie;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moviebuff.moviebuff_backend.dto.request.MovieRequest;
import com.moviebuff.moviebuff_backend.dto.response.MovieResponse;
import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.service.movie.IMovieService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor

public class MovieController {
    private static final Logger logger = LoggerFactory.getLogger(MovieController.class);

    @Autowired
    private final IMovieService movieService;

     @GetMapping
    public ResponseEntity<Page<MovieResponse>> getAllMovies(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) List<String> genres,
            @RequestParam(required = false) List<String> languages,
            @RequestParam(required = false) List<String> experience,
            @RequestParam(required = false) Movie.MovieStatus status,
            @RequestParam(required = false) Double minRating, Pageable pageable) {
        try {
            return ResponseEntity.ok(movieService.getAllMovies(title, genres, languages, experience, status, minRating, pageable));
        } catch (Exception e) {
            logger.error("Error fetching movies with filters", e);
            throw e;
        }
    }

    @GetMapping("/statuses")
    public Movie.MovieStatus[] getMovieStatus() {
        return Movie.MovieStatus.values();
    }

    @GetMapping("/latest-released")
    public ResponseEntity<?> getLatestReleasedMovies(@RequestParam(defaultValue = "5") int limit) {
        try {
            List<Movie> movies = movieService.getLatestReleasedMovies(limit);
            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            System.out.println("Error fetching latest movies"+ e);
            logger.error("Error fetching latest released movies", e);
            throw e;
        }
    }

     @GetMapping("/upcoming-movies")
    public ResponseEntity<?> getUpcomingMovies(@RequestParam(defaultValue = "5") int limit) {
        try {
            List<Movie> movies = movieService.getUpcomingMovies(limit);
            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            System.out.println("Error fetching latest movies"+ e);
            logger.error("Error fetching latest released movies", e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(movieService.getMovieById(id));
        } catch (Exception e) {
            logger.error("Error fetching movie with id: " + id, e);
            throw e;
        }
    }

    @PostMapping
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody MovieRequest request) {
        try {
            return ResponseEntity.ok(movieService.createMovie(request));
        } catch (Exception e) {
            logger.error("Error creating movie", e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovieResponse> updateMovie(
            @PathVariable String id,
            @Valid @RequestBody MovieRequest request) {
        try {
            return ResponseEntity.ok(movieService.updateMovie(id, request));
        } catch (Exception e) {
            logger.error("Error updating movie with id: " + id, e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id) {
        try {
            movieService.deleteMovie(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting movie with id: " + id, e);
            throw e;
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<List<MovieResponse>> getTrendingMovies(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            return ResponseEntity.ok(movieService.getTrendingMovies(limit));
        } catch (Exception e) {
            logger.error("Error fetching trending movies", e);
            throw e;
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<MovieResponse>> searchMovies(
            @RequestParam String query,
            @RequestParam(required = false) Integer limit) {
        try {
            return ResponseEntity.ok(movieService.searchMovies(query, limit));
        } catch (Exception e) {
            logger.error("Error searching movies with query: " + query, e);
            throw e;
        }
    }

    @PutMapping("/{id}/cast")
    public ResponseEntity<MovieResponse> updateMovieCast(
            @PathVariable String id,
            @Valid @RequestBody List<Movie.ActorReference> cast) {
        try {
            return ResponseEntity.ok(movieService.updateMovieCast(id, cast));
        } catch (Exception e) {
            logger.error("Error updating movie cast for id: " + id, e);
            throw e;
        }
    }

    @PatchMapping("/{id}/statistics")
    public ResponseEntity<MovieResponse> updateMovieStatistics(
            @PathVariable String id,
            @Valid @RequestBody Movie.MovieStatistics statistics) {
        try {
            return ResponseEntity.ok(movieService.updateMovieStatistics(id, statistics));
        } catch (Exception e) {
            logger.error("Error updating movie statistics for id: " + id, e);
            throw e;
        }
    }

    @PatchMapping("/{id}/rating")
    public ResponseEntity<MovieResponse> updateMovieRating(
            @PathVariable String id,
            @Valid @RequestBody Movie.MovieRating rating) {
        try {
            return ResponseEntity.ok(movieService.updateMovieRating(id, rating));
        } catch (Exception e) {
            logger.error("Error updating movie rating for id: " + id, e);
            throw e;
        }
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getMovieStatistics(@PathVariable String id) {
        try {
            return ResponseEntity.ok(movieService.getMovieStatistics(id));
        } catch (Exception e) {
            logger.error("Error fetching movie statistics for id: " + id, e);
            throw e;
        }
    }

    @GetMapping("/by-actor/{actorId}")
    public ResponseEntity<List<MovieResponse>> getMoviesByActor(@PathVariable String actorId) {
        try {
            return ResponseEntity.ok(movieService.getMoviesByActor(actorId));
        } catch (Exception e) {
            logger.error("Error fetching movies for actor: " + actorId, e);
            throw e;
        }
    }
}