// src/main/java/com/moviebuff/moviebuff_backend/MoviebuffBackendApplication.java

package com.moviebuff.moviebuff_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableMongoRepositories(basePackages = "com.moviebuff.moviebuff_backend.repository")
public class MoviebuffBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(MoviebuffBackendApplication.class, args);
    }
}