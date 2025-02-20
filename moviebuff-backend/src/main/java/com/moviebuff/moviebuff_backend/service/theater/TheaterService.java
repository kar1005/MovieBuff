package com.moviebuff.moviebuff_backend.service.theater;

import com.moviebuff.moviebuff_backend.dto.request.*;
import com.moviebuff.moviebuff_backend.dto.response.*;
import com.moviebuff.moviebuff_backend.model.theater.Theater;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TheaterService implements ITheaterService {

    @Autowired
    private ITheaterRepository theaterRepository;

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
        // This would typically involve aggregating data from shows and bookings
        // collections
        // Implementation would depend on specific analytics requirements
        throw new UnsupportedOperationException("Method not implemented yet");
    }

    @Override
    public TheaterResponse.TheaterStats getTheaterStats(String theaterId) {
        Theater theater = getTheaterEntity(theaterId);
        return theaterMapper.toTheaterResponse(theater).getStats();
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