package com.moviebuff.moviebuff_backend.repository.interfaces.theater;

import com.moviebuff.moviebuff_backend.model.theater.Theater;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ITheaterRepository extends MongoRepository<Theater, String> {
    // Basic queries
    List<Theater> findTheatersByLocation_City(String city);
    List<Theater> findTheatersByStatus(Theater.TheaterStatus status);
    
    // Location-based queries
    @Query("{'location.coordinates': {$near: {$geometry: {type: 'Point', coordinates: ?0}, $maxDistance: ?1}}}")
    List<Theater> findTheatersNearLocation(double[] coordinates, double radius);
    
    // Search queries
    @Query("{$and: [" +
           "  {$or: [" +
           "    {'name': {$regex: ?0, $options: 'i'}}, " +
           "    {'description': {$regex: ?0, $options: 'i'}}" +
           "  ]}, " +
           "  {'amenities': {$all: ?1}}, " +
           "  {'location.city': ?2}" +
           "]}")
    List<Theater> searchTheaters(String query, List<String> amenities, String city);
    
    @Query("{$and: [" +
           "  {$or: [" +
           "    {'name': {$regex: ?0, $options: 'i'}}, " +
           "    {'description': {$regex: ?0, $options: 'i'}}" +
           "  ]}, " +
           "  {'location.city': ?1}" +
           "]}")
    List<Theater> searchTheatersByQueryAndCity(String query, String city);
    
    @Query("{'amenities': {$all: ?0}, 'location.city': ?1}")
    List<Theater> searchTheatersByAmenitiesAndCity(List<String> amenities, String city);
    
    // Analytics queries
    @Query("{$and: [" +
           "  {'_id': ?0}, " +
           "  {'screens.screenNumber': ?1}" +
           "]}")
    Theater findTheaterWithScreen(String theaterId, Integer screenNumber);
    
    // Status management
    @Query("{'status': ?0, 'location.city': ?1}")
    List<Theater> findTheatersByStatusAndCity(Theater.TheaterStatus status, String city);
    
    // Screen queries
    @Query(value = "{'_id': ?0}", fields = "{'screens': 1}")
    Theater findTheaterScreensById(String theaterId);
    
    @Query(value = "{'_id': ?0, 'screens.screenNumber': ?1}", fields = "{'screens.$': 1}")
    Theater findScreenByTheaterIdAndNumber(String theaterId, Integer screenNumber);
    
    // Count queries
    @Query(count = true, value = "{'location.city': ?0}")
    long countTheatersByCity(String city);
    
    @Query(count = true, value = "{'status': ?0}")
    long countTheatersByStatus(Theater.TheaterStatus status);
    
    // Complex queries for analytics
    @Query(value = "{'_id': ?0}", fields = "{'screens.totalSeats': 1, 'screens.screenNumber': 1}")
    Theater findTheaterWithScreenCapacity(String theaterId);
    
    @Query("{'location.city': ?0, 'status': 'ACTIVE'}")
    List<Theater> findActiveTheatersByCity(String city);
    
    // Custom update queries
    @Query("{'_id': ?0, 'screens.screenNumber': ?1}")
    Theater updateScreenLayout(String theaterId, Integer screenNumber);
}