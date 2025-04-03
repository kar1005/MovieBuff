package com.moviebuff.moviebuff_backend.service.show;

import com.moviebuff.moviebuff_backend.dto.request.ShowRequest;
import com.moviebuff.moviebuff_backend.dto.response.ShowResponse;
import com.moviebuff.moviebuff_backend.exception.BadRequestException;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.model.show.Show;
import com.moviebuff.moviebuff_backend.model.theater.Theater;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.MovieRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.show.IShowRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.theater.ITheaterRepository;
import com.moviebuff.moviebuff_backend.service.show.ShowRequestMapper;
import com.moviebuff.moviebuff_backend.service.show.ShowResponseMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShowServiceImpl implements IShowService {

    private final IShowRepository showRepository;
    private final MovieRepository movieRepository;
    private final ITheaterRepository theaterRepository;
    private final ShowRequestMapper requestMapper;
    private final ShowResponseMapper responseMapper;
    private final MongoTemplate mongoTemplate;

    @Override
    @Transactional
    @CacheEvict(value = "shows", allEntries = true)
    public ShowResponse createShow(ShowRequest request) {
        validateShowRequest(request);
        validateShowTimings(request);
        System.out.println("-----------------------------------------------");
        System.out.println("Show Request : "+request);
        System.out.println("-----------------------------------------------");

        Show show = requestMapper.mapToEntity(request);
        
        // Make sure end time is calculated
        if (show.getEndTime() == null) {
            Movie movie = movieRepository.findById(request.getMovieId())
                    .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + request.getMovieId()));
            show.calculateEndTime(movie.getDuration());
        }
        
        Show savedShow = showRepository.save(show);
        
        return responseMapper.mapToResponse(savedShow);
    }
    

    @Override
    @Transactional
    @CacheEvict(value = "shows", key = "#id")
    public ShowResponse updateShow(String id, ShowRequest request) {
        Show existingShow = showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
        
        // Validate request and show timings
        validateShowRequest(request);
        validateShowTimingsForUpdate(request, existingShow);
        
        // Only allow updates if show hasn't started
        if (existingShow.getShowTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot update show that has already started");
        }
        
        // Update show
        requestMapper.updateEntityFromRequest(existingShow, request);
        
        // Recalculate end time
        Movie movie = movieRepository.findById(existingShow.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + existingShow.getMovieId()));
        
        existingShow.calculateEndTime(movie.getDuration());
        
        Show updatedShow = showRepository.save(existingShow);
        
        return responseMapper.mapToResponse(updatedShow);
    }

    @Override
    @Transactional
    @CacheEvict(value = "shows", key = "#id")
    public void deleteShow(String id) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
        
        // Only allow deletion if show hasn't started and has no bookings
        if (show.getShowTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot delete show that has already started");
        }
        
        if (show.getBookedSeats() != null && show.getBookedSeats() > 0) {
            throw new BadRequestException("Cannot delete show with existing bookings");
        }
        
        showRepository.deleteById(id);
    }

    @Override
    @Cacheable(value = "shows", key = "#id")
    public ShowResponse getShow(String id) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
        
        // Increment view count
        show.setViewCount(show.getViewCount() + 1);
        show.calculatePopularityScore();
        showRepository.save(show);
        
        return responseMapper.mapToResponse(show);
    }

    @Override
    @Cacheable(value = "shows", key = "'theater:' + #theaterId")
    public List<ShowResponse> getShowsByTheater(String theaterId) {
        List<Show> shows = showRepository.findByTheaterIdAndShowTimeAfter(theaterId, LocalDateTime.now());
        return shows.stream()
                .map(responseMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "shows", key = "'movie:' + #movieId")
    public List<ShowResponse> getShowsByMovie(String movieId) {
        List<Show> shows = showRepository.findByMovieIdAndShowTimeAfter(movieId, LocalDateTime.now());
        return shows.stream()
                .map(responseMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShowResponse> getShowsByTheaterAndScreen(String theaterId, int screenNumber, LocalDateTime startTime, LocalDateTime endTime) {
        List<Show> shows = showRepository.findByTheaterIdAndScreenNumberAndShowTimeBetween(
                theaterId, screenNumber, startTime, endTime);
        return shows.stream()
                .map(responseMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShowResponse> getShowsByDate(String date, String city) {
        // Parse date string to LocalDate
        LocalDate localDate = LocalDate.parse(date, DateTimeFormatter.ISO_DATE);
        
        // Create start and end time for the day
        LocalDateTime startTime = localDate.atStartOfDay();
        LocalDateTime endTime = localDate.atTime(LocalTime.MAX);
        
        List<Show> shows;
        if (city != null && !city.isEmpty()) {
            // Get theaters in the city
            List<Theater> theaters = theaterRepository.findByLocationCity(city);
            List<String> theaterIds = theaters.stream()
                    .map(Theater::getId)
                    .collect(Collectors.toList());
            
            // Get shows from these theaters on the specified date
            shows = showRepository.findByTheaterIdInAndShowTimeBetween(theaterIds, startTime, endTime);
        } else {
            // Get all shows on the specified date
            shows = showRepository.findByShowTimeBetween(startTime, endTime);
        }
        
        return shows.stream()
                .map(responseMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShowResponse> getShowsByMovieAndCity(String movieId, String city) {
        // Get theaters in the city
        List<Theater> theaters = theaterRepository.findByLocationCity(city);
        List<String> theaterIds = theaters.stream()
                .map(Theater::getId)
                .collect(Collectors.toList());
        
        // Get shows for the movie from these theaters
        List<Show> shows = showRepository.findByMovieIdAndTheaterIdInAndShowTimeAfter(
                movieId, theaterIds, LocalDateTime.now());
        
        return shows.stream()
                .map(responseMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShowResponse> getTrendingShows(String city, int limit) {
        List<Show> shows;
        
        if (city != null && !city.isEmpty()) {
            // Get theaters in the city
            List<Theater> theaters = theaterRepository.findByLocationCity(city);
            List<String> theaterIds = theaters.stream()
                    .map(Theater::getId)
                    .collect(Collectors.toList());
            
            // Get shows from these theaters
            shows = showRepository.findByTheaterIdInAndShowTimeAfter(theaterIds, LocalDateTime.now());
        } else {
            // Get all upcoming shows
            shows = showRepository.findByShowTimeAfter(LocalDateTime.now());
        }
        
        // Sort by popularity score and limit
        shows = shows.stream()
                .sorted(Comparator.comparing(Show::getPopularityScore, Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toList());
        
        return shows.stream()
                .map(responseMapper::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = "shows", key = "#showId")
    public void updateShowStatus(String showId, String status) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        try {
            Show.ShowStatus newStatus = Show.ShowStatus.valueOf(status.toUpperCase());
            show.setStatus(newStatus);
            show.setUpdatedAt(LocalDateTime.now());
            showRepository.save(show);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid show status: " + status);
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "shows", key = "#showId")
    public void updateSeatAvailability(String showId, List<String> seatIds, boolean available) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        // Validate show time
        if (show.getShowTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot update seats for a show that has already started");
        }
        
        // Update seat status
        if (show.getSeatStatus() != null) {
            for (Show.SeatStatus seat : show.getSeatStatus()) {
                if (seatIds.contains(seat.getSeatId())) {
                    seat.setStatus(available ? Show.SeatAvailability.AVAILABLE : Show.SeatAvailability.UNAVAILABLE);
                    seat.setLastUpdated(LocalDateTime.now());
                }
            }
            
            // Update availability counters
            show.updateAvailabilityCounters();
            
            // Update show status
            show.updateShowStatus();
            
            // Save changes
            show.setUpdatedAt(LocalDateTime.now());
            showRepository.save(show);
        }
    }

    @Override
    public Map<String, Object> getSeatAvailability(String showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
        
        Map<String, Object> result = new HashMap<>();
        result.put("showId", show.getId());
        result.put("totalSeats", show.getTotalSeats());
        result.put("availableSeats", show.getAvailableSeats());
        result.put("bookedSeats", show.getBookedSeats());
        
        // Group seats by category
        Map<String, List<Map<String, Object>>> seatsByCategory = new HashMap<>();
        
        if (show.getSeatStatus() != null) {
            for (Show.SeatStatus seat : show.getSeatStatus()) {
                Map<String, Object> seatInfo = new HashMap<>();
                seatInfo.put("seatId", seat.getSeatId());
                seatInfo.put("row", seat.getRow());
                seatInfo.put("column", seat.getColumn());
                seatInfo.put("status", seat.getStatus().name());
                
                seatsByCategory.computeIfAbsent(seat.getCategory(), k -> new ArrayList<>()).add(seatInfo);
            }
        }
        
        result.put("seatsByCategory", seatsByCategory);
        
        // Add pricing information
        result.put("pricing", show.getPricing());
        
        return result;
    }

    @Override
    public Map<String, Object> getShowAnalytics(String startDate, String endDate, String movieId, String theaterId) {
        // Parse dates
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start = startDate != null ? 
                LocalDate.parse(startDate, formatter).atStartOfDay() : 
                LocalDate.now().minusMonths(1).atStartOfDay();
        
        LocalDateTime end = endDate != null ? 
                LocalDate.parse(endDate, formatter).atTime(23, 59, 59) : 
                LocalDateTime.now();
        
        Map<String, Object> analytics = new HashMap<>();
        
        // Build base criteria
        Criteria criteria = Criteria.where("showTime").gte(start).lte(end);
        
        // Add movie filter
        if (movieId != null) {
            criteria = criteria.and("movieId").is(movieId);
        }
        
        // Add theater filter
        if (theaterId != null) {
            criteria = criteria.and("theaterId").is(theaterId);
        }
        
        // Total shows count
        long totalShows = mongoTemplate.count(new Query(criteria), Show.class);
        analytics.put("totalShows", totalShows);
        
        // Shows by status
        Aggregation statusAgg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.group("status").count().as("count"),
                Aggregation.sort(org.springframework.data.domain.Sort.Direction.DESC, "count")
        );
        
        AggregationResults<Map> statusResults = mongoTemplate.aggregate(
                statusAgg, Show.class, Map.class);
        
        Map<String, Long> showsByStatus = new HashMap<>();
        statusResults.getMappedResults().forEach(result -> {
            String status = result.get("_id") != null ? result.get("_id").toString() : "UNKNOWN";
            long count = (Long) result.get("count");
            showsByStatus.put(status, count);
        });
        analytics.put("showsByStatus", showsByStatus);
        
        // Shows by day of week
        Aggregation dowAgg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.project()
                        .andExpression("dayOfWeek(showTime)").as("dayOfWeek"),
                Aggregation.group("dayOfWeek").count().as("count"),
                Aggregation.sort(org.springframework.data.domain.Sort.Direction.ASC, "_id")
        );
        
        AggregationResults<Map> dowResults = mongoTemplate.aggregate(
                dowAgg, Show.class, Map.class);
        
        Map<String, Long> showsByDayOfWeek = new HashMap<>();
        String[] days = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
        dowResults.getMappedResults().forEach(result -> {
            int dow = (Integer) result.get("_id");
            long count = (Long) result.get("count");
            showsByDayOfWeek.put(days[dow % 7], count);
        });
        analytics.put("showsByDayOfWeek", showsByDayOfWeek);
        
        // Shows by hour of day
        Aggregation hourAgg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.project()
                        .andExpression("hour(showTime)").as("hour"),
                Aggregation.group("hour").count().as("count"),
                Aggregation.sort(org.springframework.data.domain.Sort.Direction.ASC, "_id")
        );
        
        AggregationResults<Map> hourResults = mongoTemplate.aggregate(
                hourAgg, Show.class, Map.class);
        
        Map<String, Long> showsByHour = new HashMap<>();
        hourResults.getMappedResults().forEach(result -> {
            int hour = (Integer) result.get("_id");
            long count = (Long) result.get("count");
            showsByHour.put(String.valueOf(hour), count);
        });
        analytics.put("showsByHour", showsByHour);
        
        // Average occupancy rate
        Aggregation occupancyAgg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.project()
                        .and("totalSeats").as("totalSeats")
                        .and("bookedSeats").as("bookedSeats"),
                Aggregation.group()
                        .avg("totalSeats").as("avgTotalSeats")
                        .avg("bookedSeats").as("avgBookedSeats")
        );
        
        AggregationResults<Map> occupancyResults = mongoTemplate.aggregate(
                occupancyAgg, Show.class, Map.class);
        
        if (!occupancyResults.getMappedResults().isEmpty()) {
            Map result = occupancyResults.getMappedResults().get(0);
            double avgTotalSeats = (Double) result.get("avgTotalSeats");
            double avgBookedSeats = (Double) result.get("avgBookedSeats");
            double occupancyRate = avgTotalSeats > 0 ? (avgBookedSeats / avgTotalSeats) * 100 : 0;
            analytics.put("averageOccupancyRate", Math.round(occupancyRate * 10) / 10.0);
        } else {
            analytics.put("averageOccupancyRate", 0.0);
        }
        
        // Top 5 most popular shows
        Query popularQuery = new Query(criteria);
        popularQuery.with(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "popularityScore"));
        popularQuery.limit(5);
        
        List<Show> popularShows = mongoTemplate.find(popularQuery, Show.class);
        List<Map<String, Object>> topShows = popularShows.stream()
                .map(show -> {
                    Map<String, Object> showInfo = new HashMap<>();
                    showInfo.put("id", show.getId());
                    showInfo.put("movieId", show.getMovieId());
                    showInfo.put("theaterId", show.getTheaterId());
                    showInfo.put("showTime", show.getShowTime());
                    showInfo.put("endTime", show.getEndTime());
                    showInfo.put("occupancyRate", show.getTotalSeats() > 0 ? 
                            (double) show.getBookedSeats() / show.getTotalSeats() * 100 : 0);
                    showInfo.put("popularityScore", show.getPopularityScore());
                    
                    // Get movie title
                    movieRepository.findById(show.getMovieId()).ifPresent(movie -> {
                        showInfo.put("movieTitle", movie.getTitle());
                    });
                    
                    // Get theater name
                    theaterRepository.findById(show.getTheaterId()).ifPresent(theater -> {
                        showInfo.put("theaterName", theater.getName());
                    });
                    
                    return showInfo;
                })
                .collect(Collectors.toList());
        
        analytics.put("topPopularShows", topShows);
        
        return analytics;
    }
    
    // Helper methods
    
    private void validateShowRequest(ShowRequest request) {
        // Check if movie exists
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + request.getMovieId()));
        
        // Check if theater exists
        Theater theater = theaterRepository.findById(request.getTheaterId())
                .orElseThrow(() -> new ResourceNotFoundException("Theater not found with id: " + request.getTheaterId()));
        
        // Check if screen exists in theater
        Theater.Screen screen = theater.getScreens().stream()
                .filter(s -> s.getScreenNumber().equals(request.getScreenNumber()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found with number: " + request.getScreenNumber()));
        
        // Check if screen supports the experience
        if (!screen.getSupportedExperiences().contains(request.getExperience())) {
            throw new BadRequestException("Screen does not support experience: " + request.getExperience());
        }
        
        // Check if pricing information is provided for each section
        if (screen.getLayout() != null && screen.getLayout().getSections() != null) {
            for (Theater.Section section : screen.getLayout().getSections()) {
                if (!request.getPricing().containsKey(section.getCategoryName())) {
                    throw new BadRequestException("Pricing information missing for section: " + section.getCategoryName());
                }
            }
        }
        
        // Validate show time is in the future
        if (request.getShowTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Show time must be in the future");
        }
    }
    
    private void validateShowTimings(ShowRequest request) {
        // Get movie details to determine duration
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + request.getMovieId()));
        
        // Calculate total duration including interval and cleanup
        int totalDuration = movie.getDuration();
        if (request.getIntervalTime() != null && request.getIntervalTime() > 0) {
            totalDuration += request.getIntervalTime();
        }
        if (request.getCleanupTime() != null && request.getCleanupTime() > 0) {
            totalDuration += request.getCleanupTime();
        }
        
        // Calculate show end time based on movie duration
        LocalDateTime showEndTime = request.getShowTime().plusMinutes(totalDuration);
        
        // Add buffer time between shows (e.g., 30 minutes)
        LocalDateTime bufferStartTime = request.getShowTime().minusMinutes(30);
        LocalDateTime bufferEndTime = showEndTime.plusMinutes(30);
        
        // Check for conflicting shows
        List<Show> conflictingShows = showRepository.findByTheaterIdAndScreenNumberAndShowTimeBetween(
                request.getTheaterId(), 
                request.getScreenNumber(),
                bufferStartTime,
                bufferEndTime
        );
        
        if (!conflictingShows.isEmpty()) {
            throw new BadRequestException("Show timing conflicts with existing shows (including buffer time)");
        }
    }
    
    private void validateShowTimingsForUpdate(ShowRequest request, Show existingShow) {
        // Get movie details to determine duration
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + request.getMovieId()));
        
        // Calculate total duration including interval and cleanup
        int totalDuration = movie.getDuration();
        if (request.getIntervalTime() != null && request.getIntervalTime() > 0) {
            totalDuration += request.getIntervalTime();
        }
        if (request.getCleanupTime() != null && request.getCleanupTime() > 0) {
            totalDuration += request.getCleanupTime();
        }
        
        // Calculate show end time based on movie duration
        LocalDateTime showEndTime = request.getShowTime().plusMinutes(totalDuration);
        
        // Add buffer time between shows (e.g., 30 minutes)
        LocalDateTime bufferStartTime = request.getShowTime().minusMinutes(30);
        LocalDateTime bufferEndTime = showEndTime.plusMinutes(30);
        
        // Check for conflicting shows, excluding the current show
        List<Show> conflictingShows = showRepository.findByTheaterIdAndScreenNumberAndShowTimeBetween(
                request.getTheaterId(), 
                request.getScreenNumber(),
                bufferStartTime,
                bufferEndTime
        ).stream()
                .filter(show -> !show.getId().equals(existingShow.getId()))
                .collect(Collectors.toList());
        
        if (!conflictingShows.isEmpty()) {
            throw new BadRequestException("Show timing conflicts with existing shows (including buffer time)");
        }
    }



    
}