package com.moviebuff.moviebuff_backend.repository.impl.movie;

import com.moviebuff.moviebuff_backend.model.movie.Movie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MovieRepositoryImpl {
    @Autowired
    private MongoTemplate mongoTemplate;
    
    public void updateMovieStatistics(String movieId, Movie.MovieStatistics statistics) {
        Query query = new Query(Criteria.where("id").is(movieId));
        Update update = new Update()
            .set("statistics", statistics)
            .set("updatedAt", java.time.LocalDateTime.now());
        
        mongoTemplate.updateFirst(query, update, Movie.class);
    }
    
    public void updateMovieRating(String movieId, Movie.MovieRating rating) {
        Query query = new Query(Criteria.where("id").is(movieId));
        Update update = new Update()
            .set("rating", rating)
            .set("updatedAt", java.time.LocalDateTime.now());
        
        mongoTemplate.updateFirst(query, update, Movie.class);
    }
    
    public List<Movie> findMoviesByFilters(List<String> genres, List<String> languages, 
                                         Movie.MovieStatus status, Double minRating) {
        Criteria criteria = new Criteria();
        
        if (genres != null && !genres.isEmpty()) {
            criteria.and("genres").in(genres);
        }
        if (languages != null && !languages.isEmpty()) {
            criteria.and("languages").in(languages);
        }
        if (status != null) {
            criteria.and("status").is(status);
        }
        if (minRating != null) {
            criteria.and("rating.average").gte(minRating);
        }
        
        return mongoTemplate.find(Query.query(criteria), Movie.class);
    }
}
