// src/main/java/com/moviebuff/moviebuff_backend/scheduler/ShowStatusScheduler.java
package com.moviebuff.moviebuff_backend.scheduler;

import com.moviebuff.moviebuff_backend.model.show.Show;
import com.moviebuff.moviebuff_backend.repository.interfaces.show.IShowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ShowStatusScheduler {
    
    private final IShowRepository showRepository;
    
    /**
     * Updates show statuses based on current time.
     * Runs every 5 minutes.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void updateShowStatuses() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Running scheduled job to update show statuses at {}", now);
        
        // Get all shows that aren't FINISHED or CANCELLED
        List<Show> activeShows = showRepository.findByStatusNotIn(List.of(
            Show.ShowStatus.FINISHED,
            Show.ShowStatus.CANCELLED
        ));
        
        int updatedCount = 0;
        for (Show show : activeShows) {
            Show.ShowStatus oldStatus = show.getStatus();
            
            // Update status based on current time
            show.updateShowStatus(now);
            
            // If status changed, save the show
            if (oldStatus != show.getStatus()) {
                log.info("Show {} status changed from {} to {}", 
                        show.getId(), oldStatus, show.getStatus());
                showRepository.save(show);
                updatedCount++;
            }
        }
        
        log.info("Show status update job completed. Updated {} shows out of {}", 
                updatedCount, activeShows.size());
    }
}