package com.moviebuff.moviebuff_backend.service.movie;

import com.moviebuff.moviebuff_backend.dto.request.MovieRequest;
import com.moviebuff.moviebuff_backend.dto.response.MovieResponse;
import com.moviebuff.moviebuff_backend.model.movie.Movie;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class MovieMapper {

    // Convert MovieRequest to Movie Entity
    public Movie toMovie(MovieRequest request) {
        if (request == null) return null;

        try {
            // Convert ActorReferenceRequest list to ActorReference list
            List<Movie.ActorReference> cast = null;
            if (request.getCast() != null) {
                cast = request.getCast().stream()
                        .map(this::toActorReference)
                        .collect(Collectors.toList());
            }

            return Movie.builder()
                    .title(request.getTitle())
                    .languages(request.getLanguages())
                    .genres(request.getGenres())
                    .experience(request.getExperience())
                    .cast(cast)
                    .description(request.getDescription())
                    .duration(request.getDuration())
                    .grade(request.getGrade())
                    .releaseDate(request.getReleaseDate())
                    .posterUrl(request.getPosterUrl())
                    .trailerUrl(request.getTrailerUrl())
                    .status(request.getStatus())
                    // Initialize rating and statistics with default values
                    .rating(Movie.MovieRating.builder()
                            .average(0.0)
                            .count(0)
                            .build())
                    .statistics(Movie.MovieStatistics.builder()
                            .totalBookings(0)
                            .revenue(0.0)
                            .popularityScore(0.0)
                            .build())
                    .build();
        } catch (Exception e) {
            log.error("Error mapping MovieRequest to Movie: {}", e.getMessage());
            throw new RuntimeException("Error creating movie: " + e.getMessage());
        }
    }

    // Convert Movie Entity to MovieResponse
    public MovieResponse toMovieResponse(Movie movie) {
        if (movie == null) return null;

        try {
            MovieResponse response = new MovieResponse();
            response.setId(movie.getId());
            response.setTitle(movie.getTitle());
            response.setLanguages(movie.getLanguages());
            response.setGenres(movie.getGenres());
            response.setExperience(movie.getExperience());
            response.setDescription(movie.getDescription());
            response.setDuration(movie.getDuration());
            response.setGrade(movie.getGrade());
            response.setReleaseDate(movie.getReleaseDate());
            response.setPosterUrl(movie.getPosterUrl());
            response.setTrailerUrl(movie.getTrailerUrl());
            response.setStatus(movie.getStatus());

            // Map cast if exists
            if (movie.getCast() != null) {
                response.setCast(movie.getCast().stream()
                        .map(this::toActorReferenceResponse)
                        .collect(Collectors.toList()));
            }

            // Map rating if exists
            if (movie.getRating() != null) {
                MovieResponse.MovieRatingResponse ratingResponse = new MovieResponse.MovieRatingResponse();
                ratingResponse.setAverage(movie.getRating().getAverage());
                ratingResponse.setCount(movie.getRating().getCount());
                response.setRating(ratingResponse);
            }

            // Map statistics if exists
            if (movie.getStatistics() != null) {
                MovieResponse.MovieStatisticsResponse statsResponse = new MovieResponse.MovieStatisticsResponse();
                statsResponse.setTotalBookings(movie.getStatistics().getTotalBookings());
                statsResponse.setRevenue(movie.getStatistics().getRevenue());
                statsResponse.setPopularityScore(movie.getStatistics().getPopularityScore());
                response.setStatistics(statsResponse);
            }

            // Add analytics
            response.setAnalytics(createDefaultAnalytics());

            return response;
        } catch (Exception e) {
            log.error("Error mapping Movie to MovieResponse: {}", e.getMessage());
            throw new RuntimeException("Error creating movie response: " + e.getMessage());
        }
    }

    // Convert ActorReferenceRequest to ActorReference
    private Movie.ActorReference toActorReference(MovieRequest.ActorReferenceRequest request) {
        if (request == null) return null;

        try {
            return Movie.ActorReference.builder()
                    .actorId(request.getActorId())
                    .name(request.getName())
                    .imageUrl(request.getImageUrl())
                    .characterName(request.getCharacterName())
                    .role(request.getRole())
                    .build();
        } catch (Exception e) {
            log.error("Error mapping ActorReferenceRequest: {}", e.getMessage());
            throw new RuntimeException("Error mapping actor reference: " + e.getMessage());
        }
    }

    // Convert ActorReference to ActorReferenceResponse
    private MovieResponse.ActorReferenceResponse toActorReferenceResponse(Movie.ActorReference actor) {
        if (actor == null) return null;

        try {
            MovieResponse.ActorReferenceResponse response = new MovieResponse.ActorReferenceResponse();
            response.setActorId(actor.getActorId());
            response.setName(actor.getName());
            response.setImageUrl(actor.getImageUrl());
            response.setCharacterName(actor.getCharacterName());
            response.setRole(actor.getRole());
            return response;
        } catch (Exception e) {
            log.error("Error mapping ActorReference to Response: {}", e.getMessage());
            throw new RuntimeException("Error mapping actor reference response: " + e.getMessage());
        }
    }

    // Helper method to create default analytics
    private MovieResponse.MovieAnalyticsResponse createDefaultAnalytics() {
        MovieResponse.MovieAnalyticsResponse analytics = new MovieResponse.MovieAnalyticsResponse();
        analytics.setTotalShows(0);
        analytics.setOccupancyRate(0.0);
        analytics.setUpcomingShows(0);
        analytics.setBookingsByCity(new HashMap<>());
        analytics.setRevenueByWeek(new HashMap<>());
        analytics.setViewsByLanguage(new HashMap<>());
        return analytics;
    }

    // Update existing Movie entity with MovieRequest data
    public void updateMovieFromRequest(Movie movie, MovieRequest request) {
        if (movie == null || request == null) return;

        try {
            movie.setTitle(request.getTitle());
            movie.setLanguages(request.getLanguages());
            movie.setGenres(request.getGenres());
            movie.setExperience(request.getExperience());
            movie.setDescription(request.getDescription());
            movie.setDuration(request.getDuration());
            movie.setGrade(request.getGrade());
            movie.setReleaseDate(request.getReleaseDate());
            movie.setPosterUrl(request.getPosterUrl());
            movie.setTrailerUrl(request.getTrailerUrl());
            movie.setStatus(request.getStatus());

            // Update cast if provided
            if (request.getCast() != null) {
                movie.setCast(request.getCast().stream()
                        .map(this::toActorReference)
                        .collect(Collectors.toList()));
            }

            // Preserve existing rating and statistics
            if (movie.getRating() == null) {
                movie.setRating(Movie.MovieRating.builder()
                        .average(0.0)
                        .count(0)
                        .build());
            }
            if (movie.getStatistics() == null) {
                movie.setStatistics(Movie.MovieStatistics.builder()
                        .totalBookings(0)
                        .revenue(0.0)
                        .popularityScore(0.0)
                        .build());
            }
        } catch (Exception e) {
            log.error("Error updating Movie from request: {}", e.getMessage());
            throw new RuntimeException("Error updating movie: " + e.getMessage());
        }
    }
}