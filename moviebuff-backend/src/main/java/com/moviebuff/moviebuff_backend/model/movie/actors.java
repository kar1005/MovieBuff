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
@Document(collection = "actors")
public class actors {
    @Id
    private String id;
    @Indexed
    private String name;
    private String imageUrl; // Cloudinary URL
    private String gender;
    private List<MovieAppearance> filmography;
    private String description;
    private LocalDate dateOfBirth;
    private List<String> awards; // Major awards and recognition
    private List<String> languages; // Languages the actor works in
    private LocalDate careerStartDate;
    private Boolean isProfile; //wheater there is a profile page or not (some basic fields are there but not all)

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovieAppearance {
        private String movieId;
        private String movieTitle;
        private String characterName;
        private String role; // LEAD, SUPPORTING, CAMEO etc.
        private LocalDate releaseDate;
        private Double movieRating;
    }
}
