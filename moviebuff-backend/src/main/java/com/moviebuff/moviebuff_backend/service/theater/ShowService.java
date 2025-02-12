package com.moviebuff.moviebuff_backend.service.theater;

import com.moviebuff.moviebuff_backend.dto.request.ShowRequest;
import com.moviebuff.moviebuff_backend.dto.response.ShowResponse;
import com.moviebuff.moviebuff_backend.model.show.Show;
import com.moviebuff.moviebuff_backend.repository.interfaces.theater.IShowRepository;
import com.moviebuff.moviebuff_backend.repository.impl.theater.ShowRepositoryImpl;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShowService implements IShowService {

    @Autowired
    private IShowRepository showRepository;

    @Autowired 
    private ShowRepositoryImpl showRepositoryImpl;
    
    @Autowired
    private ShowMapper showMapper;

    @Override
    @Transactional
    public ShowResponse createShow(ShowRequest request) {
        validateShowTimings(request);
        Show show = showMapper.mapRequestToEntity(request);
        show = showRepository.save(show);
        return showMapper.mapEntityToResponse(show);
    }

    @Override
    @Transactional 
    public ShowResponse updateShow(String id, ShowRequest request) {
        Show show = showRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
            
        // Only allow updates if show hasn't started
        if (show.getShowTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot update show that has already started");
        }
        
        validateShowTimings(request);
        showMapper.updateEntityFromRequest(show, request);
        show = showRepository.save(show);
        return showMapper.mapEntityToResponse(show);
    }

    @Override
    @Transactional
    public void deleteShow(String id) {
        Show show = showRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
            
        // Only allow deletion if show hasn't started
        if (show.getShowTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot delete show that has already started");
        }
        
        showRepository.deleteById(id);
    }

    @Override
    public ShowResponse getShow(String id) {
        return showRepository.findById(id)
            .map(showMapper::mapEntityToResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
    }

    @Override
    public List<ShowResponse> getShowsByTheater(String theaterId) {
        return showRepository.findByTheaterId(theaterId).stream()
            .map(showMapper::mapEntityToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public List<ShowResponse> getShowsByMovie(String movieId) {
        return showRepository.findUpcomingShowsByMovie(movieId, LocalDateTime.now()).stream()
            .map(showMapper::mapEntityToResponse)
            .collect(Collectors.toList());
    }

    @Override 
    public List<ShowResponse> getShowsByTheaterAndScreen(String theaterId, int screenNumber, 
            LocalDateTime startTime, LocalDateTime endTime) {
        return showRepository.findShowsByTheaterAndScreen(theaterId, screenNumber, startTime, endTime).stream()
            .map(showMapper::mapEntityToResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateShowStatus(String showId, String status) {
        // First verify the show exists
        Show show = showRepository.findById(showId)
            .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
            
        try {
            // Convert string status to enum and validate
            Show.ShowStatus newStatus = Show.ShowStatus.valueOf(status.toUpperCase());
            // Update the show's status and save it
            show.setStatus(newStatus);
            showRepository.save(show);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid show status: " + status);
        }
    }

    @Override
    @Transactional
    public void updateSeatAvailability(String showId, List<String> seatIds, boolean available) {
        Show show = showRepository.findById(showId)
            .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));
            
        // Validate show timing
        if (show.getShowTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot update seats for a show that has already started");
        }
        
        showRepositoryImpl.updateSeatAvailability(showId, seatIds, available);
    }

    private void validateShowTimings(ShowRequest request) {
        // Validate show time is in the future
        if (request.getShowTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Show time must be in the future");
        }
        
        // Calculate show end time based on movie duration
        LocalDateTime showEndTime = request.getShowTime().plusMinutes(request.getDuration());
        
        // Add buffer time between shows (e.g., 30 minutes)
        LocalDateTime bufferStartTime = request.getShowTime().minusMinutes(30);
        LocalDateTime bufferEndTime = showEndTime.plusMinutes(30);
        
        List<Show> conflictingShows = showRepositoryImpl.findConflictingShows(
            request.getTheaterId(), 
            request.getScreenNumber(),
            bufferStartTime,
            bufferEndTime
        );
        
        if (!conflictingShows.isEmpty()) {
            throw new RuntimeException("Show timing conflicts with existing shows (including buffer time)");
        }
    }
}