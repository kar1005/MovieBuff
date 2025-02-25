package com.moviebuff.moviebuff_backend.service.movie;

import com.moviebuff.moviebuff_backend.dto.request.MovieRequest;
import com.moviebuff.moviebuff_backend.dto.response.MovieResponse;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements IMovieService {

    private final MovieRepository movieRepository;
    private final MongoTemplate mongoTemplate;
    private final MovieMapper movieMapper;

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, allEntries = true)
    public MovieResponse createMovie(MovieRequest request) {
        Movie movie = movieMapper.toMovie(request);

        // Initialize statistics and rating
        movie.setStatistics(Movie.MovieStatistics.builder()
                .totalBookings(0)
                .revenue(0.0)
                .popularityScore(0.0)
                .build());

        movie.setRating(Movie.MovieRating.builder()
                .average(0.0)
                .count(0)
                .build());

        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @Override
    @Cacheable(value = "movies", key = "#id")
    public MovieResponse getMovieById(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));
        return movieMapper.toMovieResponse(movie);
    }

    @Override
    public Page<MovieResponse> getAllMovies(
            String title, List<String> genres, List<String> languages,
            List<String> experience, Movie.MovieStatus status,
            Double minRating, Pageable pageable) {

        Query query = new Query().with(pageable);
        List<Criteria> criteriaList = new ArrayList<>();

        if (title != null && !title.trim().isEmpty()) {
            criteriaList.add(Criteria.where("title").regex(title, "i"));
        }
        if (genres != null && !genres.isEmpty()) {
            criteriaList.add(Criteria.where("genres").in(genres));
        }
        if (languages != null && !languages.isEmpty()) {
            criteriaList.add(Criteria.where("languages").in(languages));
        }
        if (experience != null && !experience.isEmpty()) {
            criteriaList.add(Criteria.where("experience").in(experience));
        }
        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }
        if (minRating != null) {
            criteriaList.add(Criteria.where("rating.average").gte(minRating));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        return movieRepository.findAll(pageable).map(movieMapper::toMovieResponse);
    }

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, key = "#id")
    public MovieResponse updateMovie(String id, MovieRequest request) {
        Movie existingMovie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        Movie updatedMovie = movieMapper.toMovie(request);
        updatedMovie.setId(id);
        updatedMovie.setStatistics(existingMovie.getStatistics());
        updatedMovie.setRating(existingMovie.getRating());

        return movieMapper.toMovieResponse(movieRepository.save(updatedMovie));
    }

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, allEntries = true)
    public void deleteMovie(String id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie not found with id: " + id);
        }
        movieRepository.deleteById(id);
    }

    @Override
    @Cacheable(value = "trending-movies")
    public List<MovieResponse> getTrendingMovies(int limit) {
        return movieRepository.findTrendingMovies()
                .stream()
                .limit(limit)
                .map(movieMapper::toMovieResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MovieResponse> getUpcomingMovies(int limit) {
        return movieRepository.findUpcomingMovies(LocalDate.now(), Movie.MovieStatus.UPCOMING)
                .stream()
                .limit(limit)
                .map(movieMapper::toMovieResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MovieResponse> searchMovies(String query, Integer limit) {
        Query searchQuery = new Query();

        Criteria criteria = new Criteria().orOperator(
                Criteria.where("title").regex(query, "i"),
                Criteria.where("description").regex(query, "i"),
                Criteria.where("genres").regex(query, "i"));

        searchQuery.addCriteria(criteria);
        if (limit != null) {
            searchQuery.limit(limit);
        }

        return mongoTemplate.find(searchQuery, Movie.class)
                .stream()
                .map(movieMapper::toMovieResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "movies", key = "#id")
    public MovieResponse updateMovieCast(String id, List<Movie.ActorReference> cast) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        movie.setCast(cast);
        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, key = "#id")
    public MovieResponse updateMovieStatistics(String id, Movie.MovieStatistics statistics) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        movie.setStatistics(statistics);
        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @Override
    @CacheEvict(value = { "movies", "trending-movies" }, key = "#id")
    public MovieResponse updateMovieRating(String id, Movie.MovieRating rating) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        movie.setRating(rating);
        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @Override
    @Cacheable(value = "movie-statistics", key = "#id")
    public Map<String, Object> getMovieStatistics(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        Map<String, Object> statistics = new HashMap<>();
        statistics.put("basic", movie.getStatistics());
        statistics.put("rating", movie.getRating());

        // Add more detailed statistics here based on shows and bookings data
        // This would require additional repository calls and calculations

        return statistics;
    }

    @Override
    public List<MovieResponse> getMoviesByActor(String actorId) {
        return movieRepository.findByActorId(actorId)
                .stream()
                .map(movieMapper::toMovieResponse)
                .collect(Collectors.toList());
    }
}
