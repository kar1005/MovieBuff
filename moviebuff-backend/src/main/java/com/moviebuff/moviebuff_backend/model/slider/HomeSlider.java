package com.moviebuff.moviebuff_backend.model.slider;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "home_slider")
public class HomeSlider {
    @Id
    private String id;
    private String title;
    private String imageUrl; // Cloudinary URL
    private String cloudinaryPublicId; // Add this field
    private String description;
    
    // Generate getters, setters, constructors
}
