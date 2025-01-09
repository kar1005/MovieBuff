package com.moviebuff.moviebuff_backend.repository.interfaces.show;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.moviebuff.moviebuff_backend.model.show.Show;

@Repository
public interface IShowRepository extends MongoRepository<Show, String>{
    
}
