package com.moviebuff.moviebuff_backend.repository.interfaces.theater;

import com.moviebuff.moviebuff_backend.model.theater.Theater;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ITheaterRepository extends MongoRepository<Theater, String> {
    // Basic queries - These are used directly in service
    List<Theater> findByManagerId(String managerId);
    List<Theater> findByLocationCity(String city);
    List<Theater> findByStatus(Theater.TheaterStatus status);

    // Location-based query - This is handled by MongoTemplate in service
    // but keeping it as a backup implementation
    @Query("{'location.coordinates': {$near: {$geometry: {type: 'Point', coordinates: ?0}, $maxDistance: ?1}}}")
    List<Theater> findTheatersNearLocation(double[] coordinates, double maxDistance);

    // The following complex queries are removed as they are now handled by MongoTemplate in service:
    // - searchTheaters
    // - searchTheatersByQueryAndCity
    // - searchTheatersByAmenitiesAndCity
    // - findTheaterWithScreen
    // - findTheatersByStatusAndCity
    // - findTheaterScreensById
    // - findScreenByTheaterIdAndNumber
    // - findTheaterWithScreenCapacity
    // - updateScreenLayout

    // Analytics queries
    @Query(count = true, value = "{'location.city': ?0}")
    long countTheatersByCity(String city);

    @Query(count = true, value = "{'status': ?0}")
    long countTheatersByStatus(Theater.TheaterStatus status);

    // Active theaters query - Useful for customer facing operations
    @Query("{'location.city': ?0, 'status': 'ACTIVE'}")
    List<Theater> findActiveTheatersByCity(String city);
}