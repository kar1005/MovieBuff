package com.moviebuff.moviebuff_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
// import jakarta.validation.constraints.Past;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class ActorRequest {
    @NotBlank(message = "Actor name is required")
    private String name;
    
    private String imageUrl;
    
    // @NotBlank(message = "Gender is required")
    private String gender;
    
    private List<MovieAppearanceRequest> filmography;
    
    private String description;
    
    // @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;
    
    private List<String> awards;
    
    private List<String> languages;
    
    private LocalDate careerStartDate;
    
    private Boolean isProfile = false;

    @Data
    public static class MovieAppearanceRequest {
        private String movieId;
        private String movieTitle;
        private String characterName;
        private String role;
        private LocalDate releaseDate;
        private Double movieRating;
    }
}
