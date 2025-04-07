// src/main/java/com/moviebuff/model/movie/Movie.java
package com.moviebuff.moviebuff_backend.model.movie;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
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
    @Indexed
    private List<String> languages;
    @Indexed
    private List<String> genres;
    private List<String> experience;// 2D,3D,4D,MAX Etc....
    private List<ActorReference> cast;
    private String description;
    private Integer duration;
    private String grade;
    @Indexed
    private LocalDate releaseDate;
    private String posterUrl;
    private String trailerUrl;
    private MovieRating rating;
    @Indexed
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
        RELEASED
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActorReference {
        private String actorId;
        private String name;
        private String imageUrl;
        private String characterName;
        private String role; // LEAD, SUPPORTING, CAMEO etc.
    }
}