package com.moviebuff.moviebuff_backend.service.theater;

import com.moviebuff.moviebuff_backend.dto.request.*;
import com.moviebuff.moviebuff_backend.dto.response.*;
import com.moviebuff.moviebuff_backend.model.booking.Booking;
import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.model.show.Show;
import com.moviebuff.moviebuff_backend.model.theater.Theater;
import com.moviebuff.moviebuff_backend.repository.interfaces.bookings.IBookingRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.MovieRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.show.IShowRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.theater.ITheaterRepository;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.exception.BadRequestException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class TheaterService implements ITheaterService {

    @Autowired
    private ITheaterRepository theaterRepository;

    @Autowired
private IShowRepository showRepository;

@Autowired
private IBookingRepository bookingRepository;

@Autowired
private MovieRepository movieRepository;
private static final Logger logger = LoggerFactory.getLogger(TheaterService.class);



    @Autowired
    private MongoTemplate mongoTemplate;

    private final TheaterMapper theaterMapper = new TheaterMapper();

    // Get Theater Methods
    @Override
    public List<TheaterResponse> getAllTheaters() {
        return theaterRepository.findAll().stream()
                .map(theaterMapper::toTheaterResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TheaterResponse getTheater(String id) {
        Theater theater = theaterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Theater not found with id: " + id));
        return theaterMapper.toTheaterResponse(theater);
    }

    @Override
    public List<TheaterResponse> getTheatersByManagerId(String managerId) {
        List<Theater> theaters = theaterRepository.findByManagerId(managerId);
        return theaters.stream()
                .map(theaterMapper::toTheaterResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TheaterResponse> getTheatersByCity(String city) {
        List<Theater> theaters = theaterRepository.findByLocationCity(city);
        return theaters.stream()
                .map(theaterMapper::toTheaterResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TheaterResponse> getTheatersNearby(Double latitude, Double longitude, Double radius) {
        // Create a query to find theaters within the given radius (in kilometers)
        Query query = new Query();

        // Create a GeoJSON point from the given coordinates
        GeoJsonPoint userLocation = new GeoJsonPoint(longitude, latitude);

        // Add criteria for finding theaters within the radius
        query.addCriteria(Criteria.where("location.coordinates").nearSphere(userLocation)
                .maxDistance(radius * 1000)); // Convert km to meters

        List<Theater> nearbyTheaters = mongoTemplate.find(query, Theater.class);
        return nearbyTheaters.stream()
                .map(theaterMapper::toTheaterResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TheaterResponse> searchTheaters(String query, List<String> amenities, String city) {
        // Create criteria for search
        Criteria criteria = new Criteria();
        List<Criteria> searchCriteria = new ArrayList<>();

        // Add search criteria based on provided parameters
        if (query != null && !query.trim().isEmpty()) {
            searchCriteria.add(Criteria.where("name").regex(query, "i"));
        }

        if (amenities != null && !amenities.isEmpty()) {
            searchCriteria.add(Criteria.where("amenities").all(amenities));
        }

        if (city != null && !city.trim().isEmpty()) {
            searchCriteria.add(Criteria.where("location.city").regex(city, "i"));
        }

        // Combine all criteria with AND
        if (!searchCriteria.isEmpty()) {
            criteria = criteria.andOperator(searchCriteria.toArray(new Criteria[0]));
        }

        Query searchQuery = new Query(criteria);
        List<Theater> theaters = mongoTemplate.find(searchQuery, Theater.class);

        return theaters.stream()
                .map(theaterMapper::toTheaterResponse)
                .collect(Collectors.toList());
    }

    // Get Screen Methods
    @Override
    public List<ScreenDTO> getAllScreens(String theaterId) {
        Theater theater = getTheaterEntity(theaterId);
        return theater.getScreens().stream()
                .map(screen -> theaterMapper.toScreenDTO(screen))
                .collect(Collectors.toList());
    }

    @Override
    public ScreenDTO getScreenByNumber(String theaterId, int screenNumber) {
        Theater theater = getTheaterEntity(theaterId);
        return theater.getScreens().stream()
                .filter(screen -> screen.getScreenNumber() == screenNumber)
                .findFirst()
                .map(screen -> theaterMapper.toScreenDTO(screen))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Screen not found with number: " + screenNumber));
    }

    // Analytics and Statistics Methods
@Override
public Map<String, Object> getAnalytics(String theaterId, String startDate, String endDate, Integer screenNumber) {
    // Parse dates
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    LocalDateTime start = startDate != null ? 
            LocalDate.parse(startDate, formatter).atStartOfDay() : 
            LocalDate.now().minusMonths(1).atStartOfDay();
    
    LocalDateTime end = endDate != null ? 
            LocalDate.parse(endDate, formatter).atTime(23, 59, 59) : 
            LocalDateTime.now();
    
    Map<String, Object> analytics = new HashMap<>();
    
    try {
        // Get theater details
        Theater theater = getTheaterEntity(theaterId);
        analytics.put("name", theater.getName());
        analytics.put("totalScreens", theater.getTotalScreens());
        
        // Get all screens or specific screen
        List<Theater.Screen> screens;
        if (screenNumber != null) {
            screens = theater.getScreens().stream()
                    .filter(s -> s.getScreenNumber().equals(screenNumber))
                    .collect(Collectors.toList());
        } else {
            screens = theater.getScreens();
        }
        
        int totalSeats = 0;
        for (Theater.Screen screen : screens) {
            totalSeats += screen.getTotalSeats() != null ? screen.getTotalSeats() : 0;
        }
        analytics.put("totalSeats", totalSeats);
        
        // Get shows for this theater within date range
        List<Show> shows;
        if (screenNumber != null) {
            shows = showRepository.findByTheaterIdAndScreenNumberAndShowTimeBetween(
                    theaterId, screenNumber, start, end);
        } else {
            shows = showRepository.findByTheaterIdAndShowTimeBetween(theaterId, start, end);
        }
        
        analytics.put("totalShows", shows.size());
        
        // Get bookings for these shows
        List<String> showIds = shows.stream()
                .map(Show::getId)
                .collect(Collectors.toList());
        
        // Skip if no shows found
        if (showIds.isEmpty()) {
            analytics.put("totalBookings", 0);
            analytics.put("totalRevenue", 0.0);
            analytics.put("averageOccupancy", 0.0);
            return analytics;
        }
        
        List<Booking> bookings = bookingRepository.findByShowIdInAndStatus(
                showIds, Booking.BookingStatus.CONFIRMED);
        
        analytics.put("totalBookings", bookings.size());
        
        // Calculate revenue
        double totalRevenue = bookings.stream()
                .mapToDouble(booking -> booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0)
                .sum();
        
        analytics.put("totalRevenue", totalRevenue);
        
        // Calculate average occupancy
        double totalOccupancy = 0;
        int showsWithData = 0;
        
        for (Show show : shows) {
            if (show.getTotalSeats() != null && show.getTotalSeats() > 0) {
                int bookedSeats = show.getBookedSeats() != null ? show.getBookedSeats() : 0;
                double occupancy = (double) bookedSeats / show.getTotalSeats() * 100;
                totalOccupancy += occupancy;
                showsWithData++;
            }
        }
        
        double averageOccupancy = showsWithData > 0 ? totalOccupancy / showsWithData : 0;
        analytics.put("averageOccupancy", Math.round(averageOccupancy * 10) / 10.0); // Round to 1 decimal place
        
        // Generate daily revenue data for charts
        Map<String, Double> dailyRevenue = new LinkedHashMap<>();
        Map<String, Integer> dailyBookings = new LinkedHashMap<>();
        
        // Initialize all dates in range
        LocalDate currentDate = start.toLocalDate();
        while (!currentDate.isAfter(end.toLocalDate())) {
            String dateStr = currentDate.format(formatter);
            dailyRevenue.put(dateStr, 0.0);
            dailyBookings.put(dateStr, 0);
            currentDate = currentDate.plusDays(1);
        }
        
        // Populate with actual data
        for (Booking booking : bookings) {
            if (booking.getShowTime() != null) {
                String bookingDate = booking.getShowTime().toLocalDate().format(formatter);
                dailyRevenue.compute(bookingDate, 
                        (k, v) -> v + (booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0));
                dailyBookings.compute(bookingDate, (k, v) -> v + 1);
            }
        }
        
        // Convert maps to lists for charts
        List<Map<String, Object>> revenueTrend = new ArrayList<>();
        
        for (Map.Entry<String, Double> entry : dailyRevenue.entrySet()) {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("date", entry.getKey());
            dataPoint.put("revenue", entry.getValue());
            dataPoint.put("bookings", dailyBookings.get(entry.getKey()));
            revenueTrend.add(dataPoint);
        }
        
        analytics.put("revenueTrend", revenueTrend);
        
        // Calculate screen-wise performance
        if (screenNumber == null) {
            List<Map<String, Object>> screenPerformance = new ArrayList<>();
            
            Map<Integer, List<Show>> showsByScreen = shows.stream()
                    .collect(Collectors.groupingBy(Show::getScreenNumber));
            
            for (Map.Entry<Integer, List<Show>> entry : showsByScreen.entrySet()) {
                Integer screen = entry.getKey();
                List<Show> screenShows = entry.getValue();
                
                // Get bookings for these shows
                List<String> screenShowIds = screenShows.stream()
                        .map(Show::getId)
                        .collect(Collectors.toList());
                
                List<Booking> screenBookings = bookings.stream()
                        .filter(b -> screenShowIds.contains(b.getShowId()))
                        .collect(Collectors.toList());
                
                double screenRevenue = screenBookings.stream()
                        .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                        .sum();
                
                // Calculate screen occupancy
                double screenOccupancy = 0;
                int screenShowsWithData = 0;
                
                for (Show show : screenShows) {
                    if (show.getTotalSeats() != null && show.getTotalSeats() > 0) {
                        int bookedSeats = show.getBookedSeats() != null ? show.getBookedSeats() : 0;
                        double occupancy = (double) bookedSeats / show.getTotalSeats() * 100;
                        screenOccupancy += occupancy;
                        screenShowsWithData++;
                    }
                }
                
                double avgScreenOccupancy = screenShowsWithData > 0 ? 
                        screenOccupancy / screenShowsWithData : 0;
                
                Map<String, Object> screenData = new HashMap<>();
                screenData.put("screenNumber", screen);
                screenData.put("revenue", screenRevenue);
                screenData.put("bookings", screenBookings.size());
                screenData.put("shows", screenShows.size());
                screenData.put("occupancy", Math.round(avgScreenOccupancy * 10) / 10.0);
                
                screenPerformance.add(screenData);
            }
            
            // Sort by revenue (descending)
            screenPerformance.sort((a, b) -> 
                    Double.compare((Double) b.get("revenue"), (Double) a.get("revenue")));
            
            analytics.put("screenPerformance", screenPerformance);
        }
        
        // Get movie performance in this theater
        Map<String, List<Show>> showsByMovie = shows.stream()
                .collect(Collectors.groupingBy(Show::getMovieId));
        
        List<Map<String, Object>> moviePerformance = new ArrayList<>();
        
        for (Map.Entry<String, List<Show>> entry : showsByMovie.entrySet()) {
            String movieId = entry.getKey();
            List<Show> movieShows = entry.getValue();
            
            // Get bookings for these shows
            List<String> movieShowIds = movieShows.stream()
                    .map(Show::getId)
                    .collect(Collectors.toList());
            
            List<Booking> movieBookings = bookings.stream()
                    .filter(b -> movieShowIds.contains(b.getShowId()))
                    .collect(Collectors.toList());
            
            double movieRevenue = movieBookings.stream()
                    .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                    .sum();
            
            // Get movie details
            Optional<Movie> movieOpt = movieRepository.findById(movieId);
            String title = movieOpt.map(Movie::getTitle).orElse("Unknown Movie");
            
            Map<String, Object> movieData = new HashMap<>();
            movieData.put("movieId", movieId);
            movieData.put("title", title);
            movieData.put("revenue", movieRevenue);
            movieData.put("bookings", movieBookings.size());
            movieData.put("shows", movieShows.size());
            
            moviePerformance.add(movieData);
        }
        
        // Sort by revenue (descending)
        moviePerformance.sort((a, b) -> 
                Double.compare((Double) b.get("revenue"), (Double) a.get("revenue")));
        
        // Keep only top 5
        if (moviePerformance.size() > 5) {
            moviePerformance = moviePerformance.subList(0, 5);
        }
        
        analytics.put("moviePerformance", moviePerformance);
        
        // Calculate showtime distribution for heatmap
        Map<Integer, Map<Integer, Integer>> showtimeDistribution = new HashMap<>();
        
        for (int day = 1; day <= 7; day++) {
            showtimeDistribution.put(day, new HashMap<>());
            for (int hour = 9; hour <= 23; hour++) {
                showtimeDistribution.get(day).put(hour, 0);
            }
        }
        
        for (Show show : shows) {
            if (show.getShowTime() != null) {
                int day = show.getShowTime().getDayOfWeek().getValue();
                int hour = show.getShowTime().getHour();
                
                if (hour >= 9 && hour <= 23) {
                    showtimeDistribution.get(day).compute(hour, (k, v) -> v + 1);
                }
            }
        }
        
        analytics.put("showtimeDistribution", showtimeDistribution);
        
        // Calculate previous period data for growth metrics
        LocalDateTime prevStart = start.minusDays(30);
        LocalDateTime prevEnd = end.minusDays(30);
        
        List<Show> prevShows;
        if (screenNumber != null) {
            prevShows = showRepository.findByTheaterIdAndScreenNumberAndShowTimeBetween(
                    theaterId, screenNumber, prevStart, prevEnd);
        } else {
            prevShows = showRepository.findByTheaterIdAndShowTimeBetween(theaterId, prevStart, prevEnd);
        }
        
        List<String> prevShowIds = prevShows.stream()
                .map(Show::getId)
                .collect(Collectors.toList());
        
        // Skip growth calculations if no previous shows
        if (!prevShowIds.isEmpty()) {
            List<Booking> prevBookings = bookingRepository.findByShowIdInAndStatus(
                    prevShowIds, Booking.BookingStatus.CONFIRMED);
            
            double prevRevenue = prevBookings.stream()
                    .mapToDouble(booking -> booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0)
                    .sum();
            
            // Calculate growth rates
            double revenueGrowth = prevRevenue > 0 ? 
                    ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0.0;
            
            double bookingsGrowth = prevBookings.size() > 0 ? 
                    ((double) bookings.size() - prevBookings.size()) / prevBookings.size() * 100 : 0.0;
            
            analytics.put("revenueGrowth", Math.round(revenueGrowth));
            analytics.put("bookingsGrowth", Math.round(bookingsGrowth));
        } else {
            analytics.put("revenueGrowth", 0);
            analytics.put("bookingsGrowth", 0);
        }
        
    } catch (Exception e) {
        // Log the exception
        logger.error("Error generating theater analytics: " + e.getMessage(), e);
        
        // Return basic information about the error
        analytics.put("error", "Failed to generate complete analytics: " + e.getMessage());
    }
    
    return analytics;
}

@Override
public TheaterResponse.TheaterStats getTheaterStats(String theaterId) {
    Theater theater = getTheaterEntity(theaterId);
    
    // Calculate basic stats
    TheaterResponse.TheaterStats stats = new TheaterResponse.TheaterStats();
    stats.setTotalScreens(theater.getTotalScreens());
    
    // Calculate total seats
    int totalSeats = theater.getScreens().stream()
            .mapToInt(screen -> screen.getTotalSeats() != null ? screen.getTotalSeats() : 0)
            .sum();
    stats.setTotalCapacity(totalSeats);
    
    // Get current month's data
    LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
    LocalDateTime now = LocalDateTime.now();
    
    List<Show> monthlyShows = showRepository.findByTheaterIdAndShowTimeBetween(
            theaterId, startOfMonth, now);
    
    stats.setActiveShows(monthlyShows.size());
    
    // Get top movies in this theater
    Map<String, Long> movieCounts = monthlyShows.stream()
            .collect(Collectors.groupingBy(Show::getMovieId, Collectors.counting()));
    
    if (!movieCounts.isEmpty()) {
        String topMovieId = movieCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
        
        if (topMovieId != null) {
            Optional<Movie> topMovie = movieRepository.findById(topMovieId);
            stats.setTopMovie(topMovie.map(Movie::getTitle).orElse("Unknown"));
        }
    }
    
    // Calculate revenue and occupancy
    List<String> showIds = monthlyShows.stream()
            .map(Show::getId)
            .collect(Collectors.toList());
    
    if (!showIds.isEmpty()) {
        List<Booking> bookings = bookingRepository.findByShowIdInAndStatus(
                showIds, Booking.BookingStatus.CONFIRMED);
        
        double totalRevenue = bookings.stream()
                .mapToDouble(booking -> booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0)
                .sum();
        
        stats.setMonthlyRevenue(totalRevenue);
        stats.setMonthlyBookings((long) bookings.size());
        
        // Calculate occupancy
        double totalOccupancy = 0;
        int showsWithData = 0;
        
        for (Show show : monthlyShows) {
            if (show.getTotalSeats() != null && show.getTotalSeats() > 0) {
                int bookedSeats = show.getBookedSeats() != null ? show.getBookedSeats() : 0;
                double occupancy = (double) bookedSeats / show.getTotalSeats() * 100;
                totalOccupancy += occupancy;
                showsWithData++;
            }
        }
        
        double avgOccupancy = showsWithData > 0 ? totalOccupancy / showsWithData : 0;
        stats.setOccupancyRate(Math.round(avgOccupancy * 10) / 10.0);
    } else {
        stats.setMonthlyRevenue(0.0);
        stats.setMonthlyBookings(0L);
        stats.setOccupancyRate(0.0);
    }
    
    return stats;
}

    // Post Theater Methods
    @Override
    @Transactional
    public TheaterResponse createTheater(TheaterRequest request) {
        validateTheaterRequest(request);
        Theater theater = theaterMapper.toTheater(request);

        // Calculate and set total seats for each screen
        if (theater.getScreens() != null) {
            theater.getScreens().forEach(this::calculateAndSetScreenSeats);
        }

        Theater savedTheater = theaterRepository.save(theater);
        return theaterMapper.toTheaterResponse(savedTheater);
    }

    // Put Theater Methods
    @Override
    @Transactional
    public TheaterResponse updateTheater(String id, TheaterRequest request) {
        validateTheaterRequest(request);
        Theater existingTheater = getTheaterEntity(id);

        // Update the existing theater with new values
        Theater updatedTheater = theaterMapper.toTheater(request);
        updatedTheater.setId(id);

        // Preserve existing screens if not provided in update request
        if (request.getScreens() == null || request.getScreens().isEmpty()) {
            updatedTheater.setScreens(existingTheater.getScreens());
        } else {
            // Calculate and set total seats for each screen
            updatedTheater.getScreens().forEach(this::calculateAndSetScreenSeats);
        }

        Theater savedTheater = theaterRepository.save(updatedTheater);
        return theaterMapper.toTheaterResponse(savedTheater);
    }

    @Override
    @Transactional
    public TheaterResponse addScreen(String theaterId, ScreenDTO screenRequest) {
        Theater theater = getTheaterEntity(theaterId);

        // Validate screen number uniqueness
        if (theater.getScreens().stream()
                .anyMatch(s -> s.getScreenNumber().equals(screenRequest.getScreenNumber()))) {
            throw new BadRequestException("Screen number already exists: " + screenRequest.getScreenNumber());
        }

        Theater.Screen newScreen = theaterMapper.toScreen(screenRequest);
        calculateAndSetScreenSeats(newScreen);

        theater.getScreens().add(newScreen);
        theater.setTotalScreens(theater.getScreens().size());

        Theater updatedTheater = theaterRepository.save(theater);
        return theaterMapper.toTheaterResponse(updatedTheater);
    }

    @Override
    @Transactional
    public TheaterResponse updateScreen(String theaterId, int screenNumber, ScreenDTO screenRequest) {
        Theater theater = getTheaterEntity(theaterId);

        // Find and update the specific screen
        List<Theater.Screen> screens = theater.getScreens();
        int screenIndex = -1;

        for (int i = 0; i < screens.size(); i++) {
            if (screens.get(i).getScreenNumber() == screenNumber) {
                screenIndex = i;
                break;
            }
        }

        if (screenIndex == -1) {
            throw new ResourceNotFoundException("Screen not found with number: " + screenNumber);
        }

        Theater.Screen updatedScreen = theaterMapper.toScreen(screenRequest);
        calculateAndSetScreenSeats(updatedScreen);
        screens.set(screenIndex, updatedScreen);

        Theater updatedTheater = theaterRepository.save(theater);
        return theaterMapper.toTheaterResponse(updatedTheater);
    }

    // Delete Methods
    @Override
    @Transactional
    public void deleteTheater(String id) {
        if (!theaterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Theater not found with id: " + id);
        }
        theaterRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteScreen(String theaterId, int screenNumber) {
        Theater theater = getTheaterEntity(theaterId);

        boolean removed = theater.getScreens().removeIf(
                screen -> screen.getScreenNumber() == screenNumber);

        if (!removed) {
            throw new ResourceNotFoundException("Screen not found with number: " + screenNumber);
        }

        theater.setTotalScreens(theater.getScreens().size());
        theaterRepository.save(theater);
    }

    // Theater Status Management
    @Override
    @Transactional
    public TheaterResponse updateTheaterStatus(String id, Theater.TheaterStatus status) {
        Theater theater = getTheaterEntity(id);
        theater.setStatus(status);
        Theater updatedTheater = theaterRepository.save(theater);
        return theaterMapper.toTheaterResponse(updatedTheater);
    }

    // Helper Methods
    private Theater getTheaterEntity(String id) {
        return theaterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Theater not found with id: " + id));
    }

    private void validateTheaterRequest(TheaterRequest request) {
        if (request == null) {
            throw new BadRequestException("Theater request cannot be null");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Theater name is required");
        }

        if (request.getManagerId() == null || request.getManagerId().trim().isEmpty()) {
            throw new BadRequestException("Manager ID is required");
        }

        if (request.getLocation() == null) {
            throw new BadRequestException("Theater location is required");
        }
    }

    private void calculateAndSetScreenSeats(Theater.Screen screen) {
        if (screen.getLayout() == null) {
            screen.setTotalSeats(0);
            screen.setAvailableSeats(0);
            return;
        }

        Theater.ScreenLayout layout = screen.getLayout();

        // Get all unavailable positions
        Set<String> unavailablePositions = new HashSet<>();

        // Add unavailable seats
        if (layout.getUnavailableSeats() != null) {
            layout.getUnavailableSeats()
                    .forEach(seat -> unavailablePositions.add(seat.getRow() + "-" + seat.getColumn()));
        }

        // Add seat gaps
        if (layout.getSeatGaps() != null) {
            layout.getSeatGaps().forEach(gap -> unavailablePositions.add(gap.getRow() + "-" + gap.getColumn()));
        }

        // Calculate total available seats
        int totalAvailableSeats = 0;
        if (layout.getSections() != null) {
            for (Theater.Section section : layout.getSections()) {
                if (section.getSeats() != null) {
                    totalAvailableSeats += section.getSeats().stream()
                            .filter(seat -> seat.getIsActive() &&
                                    !unavailablePositions.contains(seat.getRow() + "-" + seat.getColumn()))
                            .count();
                }
            }
        }

        screen.setTotalSeats(totalAvailableSeats);
        screen.setAvailableSeats(totalAvailableSeats); // Initially all seats are available
    }
}