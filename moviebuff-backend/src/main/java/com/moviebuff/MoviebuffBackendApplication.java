// src/main/java/com/moviebuff/MoviebuffBackendApplication.java
package com.moviebuff;  // Make sure this matches your directory structure

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MoviebuffBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(MoviebuffBackendApplication.class, args);
    }
}