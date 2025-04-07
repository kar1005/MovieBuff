package com.moviebuff.moviebuff_backend.service.movie;


import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.moviebuff.moviebuff_backend.dto.request.MovieRequest;
import com.moviebuff.moviebuff_backend.dto.response.MovieResponse;
import com.moviebuff.moviebuff_backend.model.movie.Movie;

public interface IMovieService {
    MovieResponse createMovie(MovieRequest request);
    MovieResponse getMovieById(String id);
    Page<MovieResponse> getAllMovies(String title, List<String> genres, List<String> languages, 
                                   List<String> experience, Movie.MovieStatus status, 
                                   Double minRating, Pageable pageable);
    MovieResponse updateMovie(String id, MovieRequest request);
    void deleteMovie(String id);
    List<MovieResponse> getTrendingMovies(int limit);
    List<MovieResponse> getUpcomingMovies(int limit);
    List<MovieResponse> searchMovies(String query, Integer limit);
    MovieResponse updateMovieCast(String id, List<Movie.ActorReference> cast);
    MovieResponse updateMovieStatistics(String id, Movie.MovieStatistics statistics);
    MovieResponse updateMovieRating(String id, Movie.MovieRating rating);
    Map<String, Object> getMovieStatistics(String id);
    List<MovieResponse> getMoviesByActor(String actorId);
    public List<Movie> getLatestReleasedMovies(int limit);
}
