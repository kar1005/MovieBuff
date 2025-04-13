package com.moviebuff.moviebuff_backend.controller.movie;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moviebuff.moviebuff_backend.dto.request.ActorRequest;
import com.moviebuff.moviebuff_backend.dto.response.ActorResponse;
import com.moviebuff.moviebuff_backend.model.movie.actors;
import com.moviebuff.moviebuff_backend.service.movie.IActorService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/actors")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ActorController {

    private final IActorService actorService;

    // Create new actor
    @PostMapping
    public ResponseEntity<ActorResponse> createActor(@Valid @RequestBody ActorRequest request) {
        return ResponseEntity.ok(actorService.createActor(request));
    }

    // Get actor by ID
    @GetMapping("/{id}")
    public ResponseEntity<ActorResponse> getActor(@PathVariable String id) {
        return ResponseEntity.ok(actorService.getActorById(id));
    }

    // Get all actors (paginated)
    @GetMapping
    public ResponseEntity<Page<ActorResponse>> getAllActors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) List<String> languages,
            Pageable pageable) {
        return ResponseEntity.ok(actorService.getAllActors(name, languages, pageable));
    }

    // Update actor
    @PutMapping("/{id}")
    public ResponseEntity<ActorResponse> updateActor(
            @PathVariable String id,
            @Valid @RequestBody ActorRequest request) {
        return ResponseEntity.ok(actorService.updateActor(id, request));
    }

    // Delete actor
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActor(@PathVariable String id) {
        actorService.deleteActor(id);
        return ResponseEntity.noContent().build();
    }

    // Search actors
    @GetMapping("/search")
    public ResponseEntity<List<ActorResponse>> searchActors(
            @RequestParam String query,
            @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(actorService.searchActors(query, limit));
    }

    // Get actors by movie
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ActorResponse>> getActorsByMovie(@PathVariable String movieId) {
        return ResponseEntity.ok(actorService.getActorsByMovie(movieId));
    }

    // Get actor's filmography
    @GetMapping("/{id}/filmography")
    public ResponseEntity<List<actors.MovieAppearance>> getActorFilmography(@PathVariable String id) {
        return ResponseEntity.ok(actorService.getActorFilmography(id));
    }

    // Bulk update actor's movie appearances
    @PutMapping("/{id}/filmography")
    public ResponseEntity<ActorResponse> updateFilmography(
            @PathVariable String id,
            @Valid @RequestBody List<actors.MovieAppearance> appearances) {
        return ResponseEntity.ok(actorService.updateFilmography(id, appearances));
    }

    // Get actor statistics
    @GetMapping("/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getActorStatistics(@PathVariable String id) {
        return ResponseEntity.ok(actorService.getActorStatistics(id));
    }

    // Toggle actor profile status
    @PatchMapping("/{id}/profile-status")
    public ResponseEntity<ActorResponse> toggleProfileStatus(@PathVariable String id) {
        return ResponseEntity.ok(actorService.toggleProfileStatus(id));
    }

    // Get trending actors (based on recent movie ratings and popularity)
    @GetMapping("/trending")
    public ResponseEntity<List<ActorResponse>> getTrendingActors(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(actorService.getTrendingActors(limit));
    }
    
    // Get random actors
    @GetMapping("/random")
    public ResponseEntity<List<ActorResponse>> getRandomActors(
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) String excludeId) {
        return ResponseEntity.ok(actorService.getRandomActors(limit, excludeId));
    }
}
