// src/main/java/com/moviebuff/model/movie/Movie.java
package com.moviebuff.moviebuff_backend.model.movie;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


import java.time.LocalDate;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "movies")
public class Movie {
    @Id
    private String id;
    private String title;
    private List<String> languages;
    private List<String> genres;
    private List<String> experience;//2D,3D,4D,MAX Etc....
    private List<String> cast;
    private String description;
    private Integer duration;
    private String grade;
    private LocalDate releaseDate;
    private String posterUrl;
    private String trailerUrl;
    private MovieRating rating;
    private MovieStatus status;
    private MovieStatistics statistics;

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovieRating {
        private Double average;
        private Integer count;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovieStatistics {
        private Integer totalBookings;
        private Double revenue;
        private Double popularityScore;
    }

    public enum MovieStatus {
        UPCOMING,
        NOW_SHOWING,
        ENDED
    }
}