package com.moviebuff.moviebuff_backend.repository.interfaces.movie;

import com.moviebuff.moviebuff_backend.model.movie.actors;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActorRepository extends MongoRepository<actors, String> {
    
    @Query("{'filmography.movieId': ?0}")
    List<actors> findByFilmographyMovieId(String movieId);
    
    List<actors> findByNameRegexIgnoreCase(String nameRegex);
    
    List<actors> findByLanguagesIn(List<String> languages);
    
    @Query("{'filmography.releaseDate': {$gt: ?0}}")
    List<actors> findByFilmographyReleaseDateAfter(LocalDate date);
    
    Boolean existsByNameAndIdNot(String name, String id);
}
