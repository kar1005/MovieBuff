package com.moviebuff.moviebuff_backend.service.movie;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.moviebuff.moviebuff_backend.dto.request.ActorRequest;
import com.moviebuff.moviebuff_backend.dto.response.ActorResponse;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.movie.actors;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.ActorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActorServiceImpl implements IActorService {
    
    private final ActorRepository actorRepository;
    private final MongoTemplate mongoTemplate;

    @Value("${cloudinary.cloud-name}")
private String cloudName;

@Value("${cloudinary.api-key}")
private String apiKey;

@Value("${cloudinary.api-secret}")
private String apiSecret;

    @Override
    @CacheEvict(value = {"actors", "trending-actors"}, allEntries = true)
    public ActorResponse createActor(ActorRequest request) {
        actors actor = mapRequestToActor(request);
        return mapToResponse(actorRepository.save(actor));
    }

    @Override
    @Cacheable(value = "actors", key = "#id")
    public ActorResponse getActorById(String id) {
        actors actor = actorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Actor not found with id: " + id));
        return mapToResponse(actor);
    }

    @Override
    public Page<ActorResponse> getAllActors(String name, List<String> languages, Pageable pageable) {
        Query query = new Query().with(pageable);
        
        if (name != null && !name.trim().isEmpty()) {
            query.addCriteria(Criteria.where("name").regex(name, "i"));
        }
        
        if (languages != null && !languages.isEmpty()) {
            query.addCriteria(Criteria.where("languages").in(languages));
        }
        
        return actorRepository.findAll(pageable)
            .map(this::mapToResponse);
    }

    @Override
    @CacheEvict(value = {"actors", "trending-actors"}, key = "#id")
    public ActorResponse updateActor(String id, ActorRequest request) {
        actors actor = actorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Actor not found with id: " + id));
        
        updateActorFromRequest(actor, request);
        return mapToResponse(actorRepository.save(actor));
    }

    
    
    @Override
    @CacheEvict(value = {"actors", "trending-actors"}, allEntries = true)
@Transactional
public void deleteActor(String id) {
    actors actor = actorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Actor not found with id: " + id));
    
    // Delete image from Cloudinary if it exists
    if (actor.getImageUrl() != null && !actor.getImageUrl().isEmpty()) {
        try {
            // Extract public ID from URL
            String imageUrl = actor.getImageUrl();
            String pattern = ".+/upload/v\\d+/(.+)\\..+";
            Pattern r = Pattern.compile(pattern);
            Matcher m = r.matcher(imageUrl);
            
            if (m.find()) {
                String publicId = m.group(1);
                
                // Direct Cloudinary API call without using the controller
                Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret
                ));
                
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                // logger.info("Deleted image from Cloudinary: {}", publicId);
            }
        } catch (Exception e) {
            // log.error("Failed to delete image from Cloudinary", e);
            // Continue with actor deletion even if image deletion fails
        }
    }
    
    // Delete the actor
    actorRepository.deleteById(id);
}

    @Override
    public List<ActorResponse> searchActors(String query, Integer limit) {
        Query searchQuery = new Query();
        
        Criteria criteria = new Criteria().orOperator(
            Criteria.where("name").regex(query, "i"),
            Criteria.where("description").regex(query, "i")
        );
        
        searchQuery.addCriteria(criteria);
        if (limit != null) {
            searchQuery.limit(limit);
        }

        return mongoTemplate.find(searchQuery, actors.class)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public List<ActorResponse> getActorsByMovie(String movieId) {
        List<actors> actors = actorRepository.findByFilmographyMovieId(movieId);
        return actors.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public List<actors.MovieAppearance> getActorFilmography(String id) {
        actors actor = actorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Actor not found with id: " + id));
        return actor.getFilmography();
    }

    @Override
    @CacheEvict(value = "actors", key = "#id")
    public ActorResponse updateFilmography(String id, List<actors.MovieAppearance> appearances) {
        actors actor = actorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Actor not found with id: " + id));
        
        actor.setFilmography(appearances);
        return mapToResponse(actorRepository.save(actor));
    }

    @Override
    public Map<String, Object> getActorStatistics(String id) {
        actors actor = actorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Actor not found with id: " + id));

        Map<String, Object> stats = new HashMap<>();
        if (actor.getFilmography() != null) {
            stats.put("totalMovies", actor.getFilmography().size());
            
            double avgRating = actor.getFilmography().stream()
                .filter(m -> m.getMovieRating() != null)
                .mapToDouble(actors.MovieAppearance::getMovieRating)
                .average()
                .orElse(0.0);
            stats.put("averageRating", avgRating);

            Map<String, Long> roleFrequency = actor.getFilmography().stream()
                .collect(Collectors.groupingBy(
                    actors.MovieAppearance::getRole,
                    Collectors.counting()
                ));
            stats.put("roleFrequency", roleFrequency);

            long upcomingMovies = actor.getFilmography().stream()
                .filter(m -> m.getReleaseDate().isAfter(LocalDate.now()))
                .count();
            stats.put("upcomingMovies", upcomingMovies);
        }

        return stats;
    }

    @Override
    @CacheEvict(value = "actors", key = "#id")
    public ActorResponse toggleProfileStatus(String id) {
        actors actor = actorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Actor not found with id: " + id));
        
        actor.setIsProfile(!actor.getIsProfile());
        return mapToResponse(actorRepository.save(actor));
    }

    @Override
    @Cacheable(value = "trending-actors")
    public List<ActorResponse> getTrendingActors(int limit) {
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
        
        Query query = new Query();
        query.addCriteria(Criteria.where("filmography.releaseDate").gte(sixMonthsAgo));
        query.limit(limit);

        return mongoTemplate.find(query, actors.class)
            .stream()
            .sorted((a1, a2) -> compareActorsByTrending(a1, a2, sixMonthsAgo))
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    // Helper methods
    private actors mapRequestToActor(ActorRequest request) {
        actors actor = new actors();
        updateActorFromRequest(actor, request);
        return actor;
    }

    private void updateActorFromRequest(actors actor, ActorRequest request) {
        actor.setName(request.getName());
        actor.setImageUrl(request.getImageUrl());
        actor.setGender(request.getGender());
        actor.setDescription(request.getDescription());
        actor.setDateOfBirth(request.getDateOfBirth());
        actor.setAwards(request.getAwards());
        actor.setLanguages(request.getLanguages());
        actor.setCareerStartDate(request.getCareerStartDate());
        actor.setIsProfile(request.getIsProfile());
        
        if (request.getFilmography() != null) {
            actor.setFilmography(request.getFilmography().stream()
                .map(this::mapToMovieAppearance)
                .collect(Collectors.toList()));
        }
    }

    private actors.MovieAppearance mapToMovieAppearance(ActorRequest.MovieAppearanceRequest request) {
        return actors.MovieAppearance.builder()
            .movieId(request.getMovieId())
            .movieTitle(request.getMovieTitle())
            .characterName(request.getCharacterName())
            .role(request.getRole())
            .releaseDate(request.getReleaseDate())
            .movieRating(request.getMovieRating())
            .build();
    }

    private ActorResponse mapToResponse(actors actor) {
        ActorResponse response = new ActorResponse();
        response.setId(actor.getId());
        response.setName(actor.getName());
        response.setImageUrl(actor.getImageUrl());
        response.setGender(actor.getGender());
        response.setDescription(actor.getDescription());
        response.setDateOfBirth(actor.getDateOfBirth());
        response.setAwards(actor.getAwards());
        response.setLanguages(actor.getLanguages());
        response.setCareerStartDate(actor.getCareerStartDate());
        response.setIsProfile(actor.getIsProfile());
        
        if (actor.getFilmography() != null) {
            response.setFilmography(actor.getFilmography().stream()
                .map(this::mapToMovieAppearanceResponse)
                .collect(Collectors.toList()));
        }
        
        response.setStats(calculateActorStats(actor));
        
        return response;
    }

    private ActorResponse.MovieAppearanceResponse mapToMovieAppearanceResponse(actors.MovieAppearance appearance) {
        ActorResponse.MovieAppearanceResponse response = new ActorResponse.MovieAppearanceResponse();
        response.setMovieId(appearance.getMovieId());
        response.setMovieTitle(appearance.getMovieTitle());
        response.setCharacterName(appearance.getCharacterName());
        response.setRole(appearance.getRole());
        response.setReleaseDate(appearance.getReleaseDate());
        response.setMovieRating(appearance.getMovieRating());
        return response;
    }

    private ActorResponse.ActorStats calculateActorStats(actors actor) {
        ActorResponse.ActorStats stats = new ActorResponse.ActorStats();
        
        if (actor.getFilmography() != null && !actor.getFilmography().isEmpty()) {
            stats.setTotalMovies(actor.getFilmography().size());
            
            // Calculate average rating
            double avgRating = actor.getFilmography().stream()
                .filter(m -> m.getMovieRating() != null)
                .mapToDouble(actors.MovieAppearance::getMovieRating)
                .average()
                .orElse(0.0);
            stats.setAverageRating(avgRating);
            
            // Find most frequent role
            String mostFrequentRole = actor.getFilmography().stream()
                .collect(Collectors.groupingBy(
                    actors.MovieAppearance::getRole,
                    Collectors.counting()
                ))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
            stats.setMostFrequentRole(mostFrequentRole);
            
            // Get recent movies (last 2 years)
            LocalDate twoYearsAgo = LocalDate.now().minusYears(2);
            List<String> recentMovies = actor.getFilmography().stream()
                .filter(m -> m.getReleaseDate().isAfter(twoYearsAgo))
                .map(actors.MovieAppearance::getMovieTitle)
                .collect(Collectors.toList());
            stats.setRecentMovies(recentMovies);
            
            // Count upcoming movies
            int upcomingMovies = (int) actor.getFilmography().stream()
                .filter(m -> m.getReleaseDate().isAfter(LocalDate.now()))
                .count();
            stats.setUpcomingMovies(upcomingMovies);
        } else {
            stats.setTotalMovies(0);
            stats.setAverageRating(0.0);
            stats.setMostFrequentRole(null);
            stats.setRecentMovies(Collections.emptyList());
            stats.setUpcomingMovies(0);
        }
        
        return stats;
    }

    private int compareActorsByTrending(actors a1, actors a2, LocalDate fromDate) {
        double score1 = calculateTrendingScore(a1, fromDate);
        double score2 = calculateTrendingScore(a2, fromDate);
        return Double.compare(score2, score1); // Descending order
    }

    private double calculateTrendingScore(actors actor, LocalDate fromDate) {
        if (actor.getFilmography() == null || actor.getFilmography().isEmpty()) {
            return 0.0;
        }

        return actor.getFilmography().stream()
            .filter(m -> m.getReleaseDate().isAfter(fromDate))
            .mapToDouble(m -> {
                double ratingScore = m.getMovieRating() != null ? m.getMovieRating() : 0.0;
                long daysAgo = fromDate.until(m.getReleaseDate()).getDays();
                // Recent movies have more weight
                double recencyWeight = Math.exp(-0.01 * daysAgo);
                return ratingScore * recencyWeight;
            })
            .sum();
    }

    // Get random actors method implementation for IActorService
    @Override
    public List<ActorResponse> getRandomActors(int limit, String excludeId) {
        // First try to get actors from trending list
        List<ActorResponse> actors = getTrendingActors(limit * 2);
        
        // Filter out the excluded actor
        if (excludeId != null) {
            actors = actors.stream()
                    .filter(actor -> !actor.getId().equals(excludeId))
                    .collect(Collectors.toList());
        }
        
        // If we don't have enough actors, get random ones
        if (actors.size() < limit) {
            // Get random page of actors
            Pageable pageable = PageRequest.of(0, 20);
            Page<actors> randomActors = actorRepository.findAll(pageable);
            
            // Convert to response and filter out already included actors
            Set<String> existingIds = actors.stream()
                    .map(ActorResponse::getId)
                    .collect(Collectors.toSet());
            
            // Use the class's own mapToResponse method instead of actorMapper
            List<ActorResponse> additionalActors = randomActors.getContent().stream()
                    .filter(actor -> !existingIds.contains(actor.getId()) && 
                            (excludeId == null || !actor.getId().equals(excludeId)))
                    .map(this::mapToResponse)  // Fixed: use the existing mapToResponse method
                    .collect(Collectors.toList());
            
            // Shuffle and add the required number of random actors
            Collections.shuffle(additionalActors);
            int remainingNeeded = Math.min(additionalActors.size(), limit - actors.size());
            if (remainingNeeded > 0) {
                actors.addAll(additionalActors.subList(0, remainingNeeded));
            }
        }
        
        // Return only the requested amount
        return actors.subList(0, Math.min(actors.size(), limit));
    }
}
