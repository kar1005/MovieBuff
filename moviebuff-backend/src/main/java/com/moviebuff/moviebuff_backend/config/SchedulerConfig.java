package com.moviebuff.moviebuff_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulerConfig {
    // This enables Spring's scheduled task execution
    // No additional code needed here - Spring will handle scheduling based on @Scheduled annotations
}