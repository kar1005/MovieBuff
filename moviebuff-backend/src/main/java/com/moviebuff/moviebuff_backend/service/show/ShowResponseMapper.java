package com.moviebuff.moviebuff_backend.service.show;

import com.moviebuff.moviebuff_backend.dto.response.ShowResponse;
// import com.moviebuff.moviebuff_backend.model.movie.Movie;
import com.moviebuff.moviebuff_backend.model.show.Show;
// import com.moviebuff.moviebuff_backend.model.theater.Theater;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.MovieRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.theater.ITheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ShowResponseMapper {

    private final MovieRepository movieRepository;
    private final ITheaterRepository theaterRepository;

    @Autowired
    public ShowResponseMapper(MovieRepository movieRepository, ITheaterRepository theaterRepository) {
        this.movieRepository = movieRepository;
        this.theaterRepository = theaterRepository;
    }

    public ShowResponse mapToResponse(Show show) {
        if (show == null) return null;

        ShowResponse response = new ShowResponse();
        response.setId(show.getId());
        response.setMovieId(show.getMovieId());
        response.setTheaterId(show.getTheaterId());
        response.setScreenNumber(show.getScreenNumber());
        response.setShowTime(show.getShowTime());
        response.setLanguage(show.getLanguage());
        response.setExperience(show.getExperience());
        response.setStatus(show.getStatus().name());
        response.setTotalSeats(show.getTotalSeats() != null ? show.getTotalSeats() : 0);
        response.setAvailableSeats(show.getAvailableSeats() != null ? show.getAvailableSeats() : 0);
        response.setBookedSeats(show.getBookedSeats() != null ? show.getBookedSeats() : 0);
        response.setPopularityScore(show.getPopularityScore() != null ? show.getPopularityScore() : 0.0);

        // Map pricing information
        if (show.getPricing() != null) {
            Map<String, ShowResponse.PricingInfo> pricingMap = new HashMap<>();
            show.getPricing().forEach((category, pricing) -> {
                ShowResponse.PricingInfo pricingInfo = new ShowResponse.PricingInfo();
                pricingInfo.setBasePrice(pricing.getBasePrice());
                
                if (pricing.getAdditionalCharges() != null) {
                    pricingInfo.setAdditionalCharges(pricing.getAdditionalCharges().stream()
                            .map(charge -> {
                                ShowResponse.AdditionalCharge additionalCharge = new ShowResponse.AdditionalCharge();
                                additionalCharge.setType(charge.getType());
                                additionalCharge.setAmount(charge.getAmount());
                                additionalCharge.setIsPercentage(charge.getIsPercentage());
                                return additionalCharge;
                            })
                            .collect(Collectors.toList()));
                }
                
                pricingInfo.setFinalPrice(pricing.getFinalPrice());
                pricingMap.put(category, pricingInfo);
            });
            response.setPricing(pricingMap);
        }

        // Map seat availability information
        if (show.getSeatStatus() != null) {
            List<ShowResponse.SeatInfo> seatInfoList = show.getSeatStatus().stream()
                    .map(seat -> {
                        ShowResponse.SeatInfo seatInfo = new ShowResponse.SeatInfo();
                        seatInfo.setSeatId(seat.getSeatId());
                        seatInfo.setRow(seat.getRow());
                        seatInfo.setColumn(seat.getColumn());
                        seatInfo.setCategory(seat.getCategory());
                        seatInfo.setStatus(seat.getStatus().name());
                        return seatInfo;
                    })
                    .collect(Collectors.toList());
            response.setSeats(seatInfoList);
        }

        // Fetch and map movie information
        movieRepository.findById(show.getMovieId()).ifPresent(movie -> {
            ShowResponse.MovieInfo movieInfo = new ShowResponse.MovieInfo();
            movieInfo.setTitle(movie.getTitle());
            movieInfo.setPosterUrl(movie.getPosterUrl());
            movieInfo.setDuration(movie.getDuration());
            movieInfo.setGrade(movie.getGrade());
            movieInfo.setRating(movie.getRating() != null ? movie.getRating().getAverage() : 0.0);
            response.setMovie(movieInfo);
        });

        // Fetch and map theater information
        theaterRepository.findById(show.getTheaterId()).ifPresent(theater -> {
            ShowResponse.TheaterInfo theaterInfo = new ShowResponse.TheaterInfo();
            theaterInfo.setName(theater.getName());
            
            if (theater.getLocation() != null) {
                theaterInfo.setAddress(theater.getLocation().getAddress());
                theaterInfo.setCity(theater.getLocation().getCity());
            }
            
            // Get screen information
            theater.getScreens().stream()
                    .filter(screen -> screen.getScreenNumber().equals(show.getScreenNumber()))
                    .findFirst()
                    .ifPresent(screen -> {
                        ShowResponse.ScreenInfo screenInfo = new ShowResponse.ScreenInfo();
                        screenInfo.setName(screen.getScreenName());
                        screenInfo.setSupportedExperiences(screen.getSupportedExperiences());
                        response.setScreen(screenInfo);
                    });
            
            response.setTheater(theaterInfo);
        });

        return response;
    }
}