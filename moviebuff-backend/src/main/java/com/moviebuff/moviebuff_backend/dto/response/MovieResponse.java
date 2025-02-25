package com.moviebuff.moviebuff_backend.dto.response;

import com.moviebuff.moviebuff_backend.model.movie.Movie;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class MovieResponse {
    private String id;
    private String title;
    private List<String> languages;
    private List<String> genres;
    private List<String> experience;
    private List<ActorReferenceResponse> cast;
    private String description;
    private Integer duration;
    private String grade;
    private LocalDate releaseDate;
    private String posterUrl;
    private String trailerUrl;
    private MovieRatingResponse rating;
    private Movie.MovieStatus status;
    private MovieStatisticsResponse statistics;
    private MovieAnalyticsResponse analytics;

    @Data
    public static class ActorReferenceResponse {
        private String actorId;
        private String name;
        private String imageUrl;
        private String characterName;
        private String role;
    }

    @Data
    public static class MovieRatingResponse {
        private Double average;
        private Integer count;
    }

    @Data
    public static class MovieStatisticsResponse {
        private Integer totalBookings;
        private Double revenue;
        private Double popularityScore;
    }

    @Data
    public static class MovieAnalyticsResponse {
        private Integer totalShows;
        private Double occupancyRate;
        private Integer upcomingShows;
        private Map<String, Integer> bookingsByCity;
        private Map<String, Double> revenueByWeek;
        private Map<String, Integer> viewsByLanguage;
    }
}
