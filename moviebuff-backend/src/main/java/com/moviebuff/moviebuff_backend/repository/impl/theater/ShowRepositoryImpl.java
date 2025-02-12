// src/main/java/com/moviebuff/moviebuff_backend/repository/impl/theater/ShowRepositoryImpl.java

package com.moviebuff.moviebuff_backend.repository.impl.theater;

import com.moviebuff.moviebuff_backend.model.show.Show;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class ShowRepositoryImpl {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    public List<Show> findConflictingShows(String theaterId, int screenNumber, LocalDateTime startTime, LocalDateTime endTime) {
        Query query = new Query(Criteria.where("theaterId").is(theaterId)
                .and("screenNumber").is(screenNumber)
                .and("showTime").gte(startTime).lt(endTime));
        return mongoTemplate.find(query, Show.class);
    }
    
    public void updateShowStatus(String showId, String status) {
        Query query = new Query(Criteria.where("_id").is(showId));
        Update update = new Update().set("status", status);
        mongoTemplate.updateFirst(query, update, Show.class);
    }
    
    public void updateSeatAvailability(String showId, List<String> seatIds, boolean available) {
        Query query = new Query(Criteria.where("_id").is(showId));
        Update update = new Update();
        for (String seatId : seatIds) {
            update.set("seatAvailability." + seatId, available);
        }
        mongoTemplate.updateFirst(query, update, Show.class);
    }
}