package com.moviebuff.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.moviebuff.model.Movie;

public interface MovieRepository extends MongoRepository<Movie, String> {
}