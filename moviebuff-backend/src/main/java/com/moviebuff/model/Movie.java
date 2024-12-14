package com.moviebuff.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "movies")
public class Movie {
    @Id
    private String id;
    private String title;
    private String description;
    private String language;
    private String genre;
    private String posterUrl;
    private String trailerLink;
    private int duration;  // in minutes
    private String grade;  // like U/A, A, U
    private String releaseDate;
    private double rating;
}