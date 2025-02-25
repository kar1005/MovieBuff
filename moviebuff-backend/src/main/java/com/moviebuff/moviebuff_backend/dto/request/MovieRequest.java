package com.moviebuff.moviebuff_backend.dto.request;

import com.moviebuff.moviebuff_backend.model.movie.Movie;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class MovieRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "At least one language is required")
    private List<String> languages;

    @NotNull(message = "At least one genre is required")
    private List<String> genres;

    private List<String> experience;

    private List<ActorReferenceRequest> cast;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be greater than 0")
    private Integer duration;

    @NotBlank(message = "Grade is required")
    private String grade;

    private LocalDate releaseDate;

    private String posterUrl;
    
    private String trailerUrl;

    @NotNull(message = "Movie status is required")
    private Movie.MovieStatus status;

    @Data
    public static class ActorReferenceRequest {
        @NotBlank(message = "Actor ID is required")
        private String actorId;
        
        @NotBlank(message = "Actor name is required")
        private String name;
        
        private String imageUrl;
        
        @NotBlank(message = "Character name is required")
        private String characterName;
        
        @NotBlank(message = "Role is required")
        private String role;
    }
}
