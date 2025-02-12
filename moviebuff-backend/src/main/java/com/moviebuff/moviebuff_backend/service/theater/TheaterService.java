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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TheaterService implements ITheaterService {

    @Autowired
    private ITheaterRepository theaterRepository;

    private final TheaterMapper theaterMapper = new TheaterMapper();

    // Basic Theater CRUD Operations
    @Override
    @Transactional
    public TheaterResponse createTheater(TheaterRequest request) {
        Theater theater = theaterMapper.mapRequestToEntity(request);
        theater = theaterRepository.save(theater);
        return theaterMapper.mapEntityToResponse(theater);
    }

    @Override
    @Transactional
    public TheaterResponse updateTheater(String id, TheaterRequest request) {
        Theater theater = getTheaterById(id);
        updateTheaterFromRequest(theater, request);
        theater = theaterRepository.save(theater);
        return theaterMapper.mapEntityToResponse(theater);
    }

    @Override
    @Transactional
    public void deleteTheater(String id) {
        if (!theaterRepository.existsById(id)) {
            throw new ResourceNotFoundException("Theater not found with id: " + id);
        }
        theaterRepository.deleteById(id);
    }

    @Override
    public TheaterResponse getTheater(String id) {
        return theaterRepository.findById(id)
                .map(theaterMapper::mapEntityToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Theater not found with id: " + id));
    }

    // Theater Listing and Search Operations
    @Override
    public List<TheaterResponse> getAllTheaters() {
        return theaterRepository.findAll().stream()
                .map(theaterMapper::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TheaterResponse> getTheatersByCity(String city) {
        return theaterRepository.findTheatersByLocation_City(city).stream()
                .map(theaterMapper::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TheaterResponse> getTheatersNearby(Double latitude, Double longitude, Double radius) {
        double[] coordinates = new double[]{latitude, longitude};
        return theaterRepository.findTheatersNearLocation(coordinates, radius).stream()
                .map(theaterMapper::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TheaterResponse> searchTheaters(String query, List<String> amenities, String city) {
        List<Theater> theaters = theaterRepository.searchTheaters(query, amenities, city);
        return theaters.stream()
                .map(theaterMapper::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    // Theater Status Management
    @Override
    @Transactional
    public TheaterResponse updateTheaterStatus(String id, Theater.TheaterStatus status) {
        Theater theater = getTheaterById(id);
        theater.setStatus(status);
        theater = theaterRepository.save(theater);
        return theaterMapper.mapEntityToResponse(theater);
    }

    // Screen Management Operations
    @Override
    @Transactional
    public TheaterResponse addScreen(String theaterId, ScreenDTO screenRequest) {
        Theater theater = getTheaterById(theaterId);
        validateScreenNumber(theater, screenRequest.getScreenNumber());
        
        Theater.Screen screen = theaterMapper.mapScreenRequestToEntity(screenRequest);
        List<Theater.Screen> screens = theater.getScreens();
        screens.add(screen);
        
        theater.setScreens(screens);
        theater.setTotalScreens(theater.getTotalScreens() + 1);
        
        theater = theaterRepository.save(theater);
        return theaterMapper.mapEntityToResponse(theater);
    }

    @Override
    @Transactional
    public TheaterResponse updateScreen(String theaterId, int screenNumber, ScreenDTO screenRequest) {
        Theater theater = getTheaterById(theaterId);
        List<Theater.Screen> screens = theater.getScreens();
        
        int screenIndex = findScreenIndex(screens, screenNumber);
        if (screenIndex == -1) {
            throw new ResourceNotFoundException("Screen not found with number: " + screenNumber);
        }
        
        Theater.Screen updatedScreen = theaterMapper.mapScreenRequestToEntity(screenRequest);
        screens.set(screenIndex, updatedScreen);
        theater.setScreens(screens);
        
        theater = theaterRepository.save(theater);
        return theaterMapper.mapEntityToResponse(theater);
    }

    @Override
    @Transactional
    public void deleteScreen(String theaterId, int screenNumber) {
        Theater theater = getTheaterById(theaterId);
        List<Theater.Screen> screens = theater.getScreens();
        
        boolean removed = screens.removeIf(screen -> screen.getScreenNumber() == screenNumber);
        if (!removed) {
            throw new ResourceNotFoundException("Screen not found with number: " + screenNumber);
        }
        
        theater.setScreens(screens);
        theater.setTotalScreens(theater.getTotalScreens() - 1);
        theaterRepository.save(theater);
    }

    @Override
    public List<ScreenResponseDTO> getAllScreens(String theaterId) {
        Theater theater = getTheaterById(theaterId);
        return theater.getScreens().stream()
                .map(theaterMapper::mapScreenToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ScreenResponseDTO getScreenByNumber(String theaterId, int screenNumber) {
        Theater theater = getTheaterById(theaterId);
        return theater.getScreens().stream()
                .filter(screen -> screen.getScreenNumber() == screenNumber)
                .findFirst()
                .map(theaterMapper::mapScreenToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found with number: " + screenNumber));
    }

    // Screen Layout Management
    @Override
    @Transactional
    public ScreenLayoutResponseDTO updateScreenLayout(String theaterId, int screenNumber, SeatLayoutRequest layoutRequest) {
        Theater theater = getTheaterById(theaterId);
        Theater.Screen screen = findScreenByNumber(theater, screenNumber);
        
        screen.setLayout(theaterMapper.mapScreenLayoutToEntity(layoutRequest));
        screen.setTotalSeats(screen.getLayout().calculateTotalAvailableSeats());
        
        theaterRepository.save(theater);
        return theaterMapper.mapLayoutToResponse(screen.getLayout());
    }

    // Analytics and Statistics
    @Override
    public Map<String, Object> getAnalytics(String theaterId, String startDate, String endDate, Integer screenNumber) {
        validateTheaterExists(theaterId);
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE;
        LocalDate start = LocalDate.parse(startDate, formatter);
        LocalDate end = LocalDate.parse(endDate, formatter);
        
        Map<String, Object> analytics = new HashMap<>();
        // TODO: Implement analytics logic based on booking data
        return analytics;
    }

    @Override
    public TheaterResponse.TheaterStats getTheaterStats(String theaterId) {
        Theater theater = getTheaterById(theaterId);
        TheaterResponse.TheaterStats stats = new TheaterResponse.TheaterStats();
        
        int totalSeats = theater.getScreens().stream()
                .mapToInt(screen -> screen.getTotalSeats() != null ? screen.getTotalSeats() : 0)
                .sum();
        
        int activeScreens = (int) theater.getScreens().stream()
                .filter(screen -> screen.getTotalSeats() != null && screen.getTotalSeats() > 0)
                .count();
        
        stats.setTotalSeats(totalSeats);
        stats.setActiveScreens(activeScreens);
        // TODO: Calculate other statistics from show and booking data
        
        return stats;
    }

    // Helper Methods
    private Theater getTheaterById(String id) {
        return theaterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Theater not found with id: " + id));
    }

    private void updateTheaterFromRequest(Theater theater, TheaterRequest request) {
        theater.setName(request.getName());
        theater.setDescription(request.getDescription());
        theater.setEmailAddress(request.getEmailAddress());
        theater.setPhoneNumber(request.getPhoneNumber());
        theater.setAmenities(request.getAmenities());
        theater.setLocation(theaterMapper.mapLocationRequestToEntity(request.getLocation()));
        
        if (request.getScreens() != null) {
            theater.setScreens(theaterMapper.mapScreenRequestsToEntities(request.getScreens()));
            theater.setTotalScreens(request.getScreens().size());
        }
    }

    private void validateTheaterExists(String theaterId) {
        if (!theaterRepository.existsById(theaterId)) {
            throw new ResourceNotFoundException("Theater not found with id: " + theaterId);
        }
    }

    private void validateScreenNumber(Theater theater, Integer screenNumber) {
        boolean screenExists = theater.getScreens().stream()
                .anyMatch(s -> s.getScreenNumber().equals(screenNumber));
        if (screenExists) {
            throw new BadRequestException("Screen number already exists: " + screenNumber);
        }
    }

    private int findScreenIndex(List<Theater.Screen> screens, int screenNumber) {
        for (int i = 0; i < screens.size(); i++) {
            if (screens.get(i).getScreenNumber() == screenNumber) {
                return i;
            }
        }
        return -1;
    }

    private Theater.Screen findScreenByNumber(Theater theater, int screenNumber) {
        return theater.getScreens().stream()
                .filter(screen -> screen.getScreenNumber() == screenNumber)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found with number: " + screenNumber));
    }
}