package com.moviebuff.moviebuff_backend.service.movie;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import com.moviebuff.moviebuff_backend.dto.request.MovieRequest;
import com.moviebuff.moviebuff_backend.dto.response.MovieResponse;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.booking.Booking;
import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.model.review.Review;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.MovieRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements IMovieService {

    private final MovieRepository movieRepository;
    private final MongoTemplate mongoTemplate;
    private final MovieMapper movieMapper;

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, allEntries = true)
    public MovieResponse createMovie(MovieRequest request) {
        Movie movie = movieMapper.toMovie(request);

        // Initialize statistics and rating
        movie.setStatistics(Movie.MovieStatistics.builder()
                .totalBookings(0)
                .revenue(0.0)
                .popularityScore(0.0)
                .build());

        movie.setRating(Movie.MovieRating.builder()
                .average(0.0)
                .count(0)
                .build());

        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @Override
    public List<Movie> getLatestReleasedMovies(int limit) {
        Query query = new Query();
        query.addCriteria(Criteria.where("status").is(Movie.MovieStatus.RELEASED));
        query.with(Sort.by(Sort.Direction.DESC, "releaseDate"));
        query.limit(limit);
        
        return mongoTemplate.find(query, Movie.class);
    }

     @Override
    public List<Movie> getUpcomingMovies(int limit) {
        Query query = new Query();
        query.addCriteria(Criteria.where("status").is(Movie.MovieStatus.UPCOMING));
        query.with(Sort.by("releaseDate"));
        query.limit(limit);
        
        return mongoTemplate.find(query, Movie.class);
    }

    @Override
    @Cacheable(value = "movies", key = "#id")
    public MovieResponse getMovieById(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));
        return movieMapper.toMovieResponse(movie);
    }

    @Override
    public Page<MovieResponse> getAllMovies(
            String title, List<String> genres, List<String> languages,
            List<String> experience, Movie.MovieStatus status,
            Double minRating, Pageable pageable) {

        Query query = new Query().with(pageable);
        List<Criteria> criteriaList = new ArrayList<>();

        if (title != null && !title.trim().isEmpty()) {
            criteriaList.add(Criteria.where("title").regex(title, "i"));
        }
        if (genres != null && !genres.isEmpty()) {
            criteriaList.add(Criteria.where("genres").in(genres));
        }
        if (languages != null && !languages.isEmpty()) {
            criteriaList.add(Criteria.where("languages").in(languages));
        }
        if (experience != null && !experience.isEmpty()) {
            criteriaList.add(Criteria.where("experience").in(experience));
        }
        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }
        if (minRating != null) {
            criteriaList.add(Criteria.where("rating.average").gte(minRating));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        return movieRepository.findAll(pageable).map(movieMapper::toMovieResponse);
    }

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, key = "#id")
    public MovieResponse updateMovie(String id, MovieRequest request) {
        Movie existingMovie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        Movie updatedMovie = movieMapper.toMovie(request);
        updatedMovie.setId(id);
        updatedMovie.setStatistics(existingMovie.getStatistics());
        updatedMovie.setRating(existingMovie.getRating());

        return movieMapper.toMovieResponse(movieRepository.save(updatedMovie));
    }

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, allEntries = true)
    public void deleteMovie(String id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie not found with id: " + id);
        }
        movieRepository.deleteById(id);
    }

    @Override
    @Cacheable(value = "trending-movies")
    public List<MovieResponse> getTrendingMovies(int limit) {
        return movieRepository.findTrendingMovies()
                .stream()
                .limit(limit)
                .map(movieMapper::toMovieResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MovieResponse> searchMovies(String query, Integer limit) {
        Query searchQuery = new Query();

        Criteria criteria = new Criteria().orOperator(
                Criteria.where("title").regex(query, "i"),
                Criteria.where("description").regex(query, "i"),
                Criteria.where("genres").regex(query, "i"));

        searchQuery.addCriteria(criteria);
        if (limit != null) {
            searchQuery.limit(limit);
        }

        return mongoTemplate.find(searchQuery, Movie.class)
                .stream()
                .map(movieMapper::toMovieResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "movies", key = "#id")
    public MovieResponse updateMovieCast(String id, List<Movie.ActorReference> cast) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        movie.setCast(cast);
        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, key = "#id")
    public MovieResponse updateMovieStatistics(String id, Movie.MovieStatistics statistics) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        movie.setStatistics(statistics);
        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, key = "#id")
    public MovieResponse updateMovieRating(String id, Movie.MovieRating rating) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        movie.setRating(rating);
        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @Override
@Cacheable(value = "movie-statistics", key = "#id")
public Map<String, Object> getMovieStatistics(String id) {
    // Handle "all" special case for overall dashboard
    boolean isOverallStats = "all".equalsIgnoreCase(id);
    
    Map<String, Object> statistics = new HashMap<>();
    
    if (!isOverallStats) {
        // For specific movie
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));
                
        statistics.put("basic", movie.getStatistics());
        statistics.put("rating", movie.getRating());
        statistics.put("movieId", movie.getId());
        statistics.put("title", movie.getTitle());
    }
    
    // Time-based aggregation - for revenue trends
    LocalDate today = LocalDate.now();
    LocalDate thirtyDaysAgo = today.minusDays(30);
    
    Criteria timeCriteria;
    if (isOverallStats) {
        timeCriteria = Criteria.where("showTime").gte(thirtyDaysAgo.atStartOfDay());
    } else {
        timeCriteria = Criteria.where("movieId").is(id)
                      .and("showTime").gte(thirtyDaysAgo.atStartOfDay());
    }
    
    // Daily revenue chart data
    Aggregation revenueByDayAgg = Aggregation.newAggregation(
        Aggregation.match(timeCriteria),
        Aggregation.match(Criteria.where("status").is(Booking.BookingStatus.CONFIRMED)),
        Aggregation.project()
            .andExpression("dateToString('%Y-%m-%d', showTime)").as("date")
            .and("totalAmount").as("amount"),
        Aggregation.group("date")
            .sum("amount").as("revenue")
            .count().as("bookings"),
        Aggregation.sort(Sort.Direction.ASC, "_id")
    );
    
    AggregationResults<Map> revenueByDayResults = mongoTemplate.aggregate(
        revenueByDayAgg, Booking.class, Map.class);
    
    List<Map<String, Object>> revenueTrend = new ArrayList<>();
    revenueByDayResults.getMappedResults().forEach(result -> {
        Map<String, Object> entry = new HashMap<>();
        entry.put("date", result.get("_id"));
        entry.put("revenue", result.get("revenue"));
        entry.put("bookings", result.get("bookings"));
        revenueTrend.add(entry);
    });
    
    statistics.put("revenueTrend", revenueTrend);
    
    // Rating distribution (1-5 stars)
    Aggregation ratingDistAgg = Aggregation.newAggregation(
        Aggregation.match(isOverallStats ? new Criteria() : Criteria.where("movieId").is(id)),
        Aggregation.group("rating")
            .count().as("count"),
        Aggregation.sort(Sort.Direction.ASC, "_id")
    );
    
    AggregationResults<Map> ratingResults = mongoTemplate.aggregate(
        ratingDistAgg, Review.class, Map.class);
    
    Map<String, Long> ratingDistribution = new HashMap<>();
    for (int i = 1; i <= 5; i++) {
        ratingDistribution.put(String.valueOf(i), 0L);
    }
    
    ratingResults.getMappedResults().forEach(result -> {
        Integer rating = (Integer) result.get("_id");
        Long count = ((Number) result.get("count")).longValue();
        ratingDistribution.put(String.valueOf(rating), count);
    });
    
    statistics.put("ratingDistribution", ratingDistribution);
    
    // Theater performance for this movie
    if (!isOverallStats) {
        Aggregation theaterPerfAgg = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("movieId").is(id)
                             .and("status").is(Booking.BookingStatus.CONFIRMED)),
            Aggregation.group("theaterId", "theaterName")
                .sum("totalAmount").as("revenue")
                .count().as("bookings"),
            Aggregation.sort(Sort.Direction.DESC, "revenue"),
            Aggregation.limit(5)
        );
        
        AggregationResults<Map> theaterResults = mongoTemplate.aggregate(
            theaterPerfAgg, Booking.class, Map.class);
        
        List<Map<String, Object>> topTheaters = new ArrayList<>();
        theaterResults.getMappedResults().forEach(result -> {
            Map<String, Object> theater = new HashMap<>();
            theater.put("id", ((Map)result.get("_id")).get("theaterId"));
            theater.put("name", ((Map)result.get("_id")).get("theaterName"));
            theater.put("revenue", result.get("revenue"));
            theater.put("bookings", result.get("bookings"));
            topTheaters.add(theater);
        });
        
        statistics.put("topTheaters", topTheaters);
    }
    
    // City-wise distribution
    Aggregation cityAgg = Aggregation.newAggregation(
        Aggregation.match(isOverallStats ? 
                         Criteria.where("status").is(Booking.BookingStatus.CONFIRMED) : 
                         Criteria.where("movieId").is(id).and("status").is(Booking.BookingStatus.CONFIRMED)),
        Aggregation.group("theaterCity")
            .sum("totalAmount").as("revenue")
            .count().as("bookings"),
        Aggregation.sort(Sort.Direction.DESC, "bookings"),
        Aggregation.limit(10)
    );
    
    AggregationResults<Map> cityResults = mongoTemplate.aggregate(
        cityAgg, Booking.class, Map.class);
    
    List<Map<String, Object>> cityStats = new ArrayList<>();
    cityResults.getMappedResults().forEach(result -> {
        Map<String, Object> city = new HashMap<>();
        city.put("city", result.get("_id"));
        city.put("revenue", result.get("revenue"));
        city.put("bookings", result.get("bookings"));
        cityStats.add(city);
    });
    
    statistics.put("cityStats", cityStats);
    
    // Overall performance metrics
    if (isOverallStats) {
        // Get the top 5 performing movies
        Aggregation topMoviesAgg = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("status").is(Booking.BookingStatus.CONFIRMED)),
            Aggregation.group("movieId", "movieTitle")
                .sum("totalAmount").as("revenue")
                .count().as("bookings"),
            Aggregation.sort(Sort.Direction.DESC, "revenue"),
            Aggregation.limit(5)
        );
        
        AggregationResults<Map> topMoviesResults = mongoTemplate.aggregate(
            topMoviesAgg, Booking.class, Map.class);
        
        List<Map<String, Object>> topMovies = new ArrayList<>();
        topMoviesResults.getMappedResults().forEach(result -> {
            Map<String, Object> movie = new HashMap<>();
            movie.put("id", ((Map)result.get("_id")).get("movieId"));
            movie.put("title", ((Map)result.get("_id")).get("movieTitle"));
            movie.put("revenue", result.get("revenue"));
            movie.put("bookings", result.get("bookings"));
            
            // Get rating
            Movie m = movieRepository.findById((String)((Map)result.get("_id")).get("movieId")).orElse(null);
            if (m != null && m.getRating() != null) {
                movie.put("rating", m.getRating().getAverage());
            } else {
                movie.put("rating", 0);
            }
            
            topMovies.add(movie);
        });
        
        statistics.put("topMovies", topMovies);
        
        // Genre distribution
        List<Movie> allMovies = movieRepository.findAll();
        Map<String, Integer> genreCounts = new HashMap<>();
        
        for (Movie m : allMovies) {
            if (m.getGenres() != null) {
                for (String genre : m.getGenres()) {
                    genreCounts.put(genre, genreCounts.getOrDefault(genre, 0) + 1);
                }
            }
        }
        
        // Convert to list for sorting
        List<Map<String, Object>> genreDistribution = new ArrayList<>();
        genreCounts.forEach((genre, count) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("genre", genre);
            entry.put("count", count);
            genreDistribution.add(entry);
        });
        
        // Sort and limit to top 10
        genreDistribution.sort((a, b) -> ((Integer)b.get("count")).compareTo((Integer)a.get("count")));
        statistics.put("genreDistribution", genreDistribution.size() > 10 ? 
                      genreDistribution.subList(0, 10) : genreDistribution);
    }
    
    // For growth calculations, get previous period data
    LocalDate sixtyDaysAgo = today.minusDays(60);
    
    Criteria prevPeriodCriteria;
    if (isOverallStats) {
        prevPeriodCriteria = Criteria.where("showTime").gte(sixtyDaysAgo.atStartOfDay())
                            .lt(thirtyDaysAgo.atStartOfDay());
    } else {
        prevPeriodCriteria = Criteria.where("movieId").is(id)
                            .and("showTime").gte(sixtyDaysAgo.atStartOfDay())
                            .lt(thirtyDaysAgo.atStartOfDay());
    }
    
    // Previous period revenue
    Aggregation prevRevenueAgg = Aggregation.newAggregation(
        Aggregation.match(prevPeriodCriteria),
        Aggregation.match(Criteria.where("status").is(Booking.BookingStatus.CONFIRMED)),
        Aggregation.group().sum("totalAmount").as("prevRevenue")
    );
    
    AggregationResults<Map> prevRevenueResults = mongoTemplate.aggregate(
        prevRevenueAgg, Booking.class, Map.class);
    
    double prevRevenue = prevRevenueResults.getMappedResults().isEmpty() ? 
                        0.0 : ((Number) prevRevenueResults.getMappedResults().get(0).get("prevRevenue")).doubleValue();
    
    // Calculate growth rates
    double currentRevenue = statistics.containsKey("totalRevenue") ? 
                          (double)statistics.get("totalRevenue") : 0.0;
    
    double revenueGrowth = prevRevenue > 0 ? 
                         ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0.0;
    
    statistics.put("revenueGrowth", Math.round(revenueGrowth));
    
    return statistics;
}

    @Override
    public List<MovieResponse> getMoviesByActor(String actorId) {
        return movieRepository.findByActorId(actorId)
                .stream()
                .map(movieMapper::toMovieResponse)
                .collect(Collectors.toList());
    }
}
