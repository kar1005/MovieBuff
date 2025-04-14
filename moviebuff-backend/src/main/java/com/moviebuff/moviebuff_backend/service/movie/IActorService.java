package com.moviebuff.moviebuff_backend.service.movie;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.moviebuff.moviebuff_backend.dto.request.ActorRequest;
import com.moviebuff.moviebuff_backend.dto.response.ActorResponse;
import com.moviebuff.moviebuff_backend.model.movie.actors;

public interface IActorService {
    ActorResponse createActor(ActorRequest request);
    ActorResponse getActorById(String id);
    Page<ActorResponse> getAllActors(String name, List<String> languages, Pageable pageable);
    ActorResponse updateActor(String id, ActorRequest request);
    void deleteActor(String id);
    List<ActorResponse> searchActors(String query, Integer limit);
    List<ActorResponse> getActorsByMovie(String movieId);
    List<actors.MovieAppearance> getActorFilmography(String id);
    ActorResponse updateFilmography(String id, List<actors.MovieAppearance> appearances);
    Map<String, Object> getActorStatistics(String id);
    ActorResponse toggleProfileStatus(String id);
    List<ActorResponse> getTrendingActors(int limit);
    List<ActorResponse> getRandomActors(int limit, String excludeId);
}