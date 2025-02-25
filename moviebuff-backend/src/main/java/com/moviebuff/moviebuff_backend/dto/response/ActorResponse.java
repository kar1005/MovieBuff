package com.moviebuff.moviebuff_backend.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class ActorResponse {
    private String id;
    private String name;
    private String imageUrl;
    private String gender;
    private List<MovieAppearanceResponse> filmography;
    private String description;
    private LocalDate dateOfBirth;
    private List<String> awards;
    private List<String> languages;
    private LocalDate careerStartDate;
    private Boolean isProfile;
    private ActorStats stats;

    @Data
    public static class MovieAppearanceResponse {
        private String movieId;
        private String movieTitle;
        private String characterName;
        private String role;
        private LocalDate releaseDate;
        private Double movieRating;
    }

    @Data
    public static class ActorStats {
        private Integer totalMovies;
        private Double averageRating;
        private String mostFrequentRole;
        private List<String> recentMovies;
        private Integer upcomingMovies;
    }
}