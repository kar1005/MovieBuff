package com.moviebuff.moviebuff_backend.model.language;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "languages")
public class Language {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String code;
    
    @Indexed
    private String name;
    
    private String nativeName;
    
    private Boolean isCustom;
    
    private Integer usageCount;
}