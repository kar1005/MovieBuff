package com.moviebuff.moviebuff_backend.repository.impl.theater;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.stereotype.Repository;

import com.moviebuff.moviebuff_backend.model.theater.Theater;
import com.moviebuff.moviebuff_backend.model.theater.Theater.Screen;
import com.moviebuff.moviebuff_backend.model.theater.Theater.ScreenLayout;

import java.util.*;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Repository
public class TheaterRepositoryImpl {
    
    @Autowired
    private MongoTemplate mongoTemplate;

    // Screen Layout Management
    public void updateTheaterLayout(String theaterId, int screenNumber, Map<String, Object> layout) {
        Query query = new Query(Criteria.where("_id").is(theaterId)
                .and("screens.screenNumber").is(screenNumber));
        Update update = new Update().set("screens.$.layout", layout);
        mongoTemplate.updateFirst(query, update, Theater.class);
    }

    public void updateScreenFeatures(String theaterId, int screenNumber, Map<String, Object> features) {
        Query query = new Query(Criteria.where("_id").is(theaterId)
                .and("screens.screenNumber").is(screenNumber));
        Update update = new Update();
        features.forEach((key, value) -> update.set("screens.$." + key, value));
        mongoTemplate.updateFirst(query, update, Theater.class);
    }

    // Screen Status Management
    public void updateScreenStatus(String theaterId, int screenNumber, String status) {
        Query query = new Query(Criteria.where("_id").is(theaterId)
                .and("screens.screenNumber").is(screenNumber));
        Update update = new Update().set("screens.$.status", status);
        mongoTemplate.updateFirst(query, update, Theater.class);
    }

    // Screen Section Management
    public void updateScreenSections(String theaterId, int screenNumber, List<Map<String, Object>> sections) {
        Query query = new Query(Criteria.where("_id").is(theaterId)
                .and("screens.screenNumber").is(screenNumber));
        Update update = new Update().set("screens.$.layout.sections", sections);
        mongoTemplate.updateFirst(query, update, Theater.class);
    }

    // Theater Search
    public List<Theater> searchTheaters(String searchQuery, List<String> amenities, String city) {
        Criteria criteria = new Criteria();
        List<Criteria> conditions = new ArrayList<>();

        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            conditions.add(new Criteria().orOperator(
                Criteria.where("name").regex(searchQuery, "i"),
                Criteria.where("description").regex(searchQuery, "i")
            ));
        }

        if (amenities != null && !amenities.isEmpty()) {
            conditions.add(Criteria.where("amenities").all(amenities));
        }

        if (city != null && !city.trim().isEmpty()) {
            conditions.add(Criteria.where("location.city").is(city));
        }

        if (!conditions.isEmpty()) {
            criteria = criteria.andOperator(conditions.toArray(new Criteria[0]));
        }

        return mongoTemplate.find(Query.query(criteria), Theater.class);
    }

    // Theater Analytics
    public Map<String, Object> getTheaterAnalytics(String theaterId, Date startDate, Date endDate) {
        MatchOperation matchTheater = match(Criteria.where("_id").is(theaterId));
        
        UnwindOperation unwindScreens = unwind("screens");
        
        GroupOperation groupByScreen = group("screens.screenNumber")
            .count().as("showCount")
            .sum("screens.totalSeats").as("totalCapacity");
            
        AggregationResults<Map> results = mongoTemplate.aggregate(
            newAggregation(matchTheater, unwindScreens, groupByScreen),
            Theater.class,
            Map.class
        );
        
        return results.getMappedResults().stream()
            .findFirst()
            .orElse(new HashMap<>());
    }

    // Screen Layout Analytics
    public Map<String, Object> getScreenAnalytics(String theaterId, int screenNumber) {
        Query query = new Query(Criteria.where("_id").is(theaterId)
                .and("screens.screenNumber").is(screenNumber));
        query.fields()
            .include("screens.$")
            .include("screens.totalSeats")
            .include("screens.layout.sections");
            
        Theater theater = mongoTemplate.findOne(query, Theater.class);
        Map<String, Object> analytics = new HashMap<>();
        
        if (theater != null && !theater.getScreens().isEmpty()) {
            Screen screen = theater.getScreens().get(0);
            analytics.put("totalSeats", screen.getTotalSeats());
            analytics.put("sections", getSectionStats(screen.getLayout()));
        }
        
        return analytics;
    }

    private Map<String, Object> getSectionStats(ScreenLayout layout) {
        if (layout == null || layout.getSections() == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> sectionStats = new HashMap<>();
        layout.getSections().forEach(section -> {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalSeats", section.getSeats().size());
            stats.put("categoryType", section.getCategoryType());
            stats.put("basePrice", section.getBasePrice());
            sectionStats.put(section.getCategoryName(), stats);
        });

        return sectionStats;
    }

    // Bulk Updates
    public void updateScreenPricing(String theaterId, int screenNumber, Map<String, Double> categoryPrices) {
        Query query = new Query(Criteria.where("_id").is(theaterId)
                .and("screens.screenNumber").is(screenNumber));
                
        Update update = new Update();
        categoryPrices.forEach((category, price) -> 
            update.set("screens.$.layout.sections.$[section].basePrice", price)
                .filterArray("section.categoryName", category)
        );
        
        mongoTemplate.updateFirst(query, update, Theater.class);
    }

    // Screen Maintenance
    public void markSeatsUnavailable(String theaterId, int screenNumber, List<Map<String, Integer>> seats) {
        Query query = new Query(Criteria.where("_id").is(theaterId)
                .and("screens.screenNumber").is(screenNumber));
                
        Update update = new Update().push("screens.$.layout.unavailableSeats")
                .each(seats.toArray());
                
        mongoTemplate.updateFirst(query, update, Theater.class);
    }

    public void removeUnavailableSeats(String theaterId, int screenNumber, List<Map<String, Integer>> seats) {
        Query query = new Query(Criteria.where("_id").is(theaterId)
                .and("screens.screenNumber").is(screenNumber));
                
        Update update = new Update().pullAll("screens.$.layout.unavailableSeats", seats.toArray());
        
        mongoTemplate.updateFirst(query, update, Theater.class);
    }
}