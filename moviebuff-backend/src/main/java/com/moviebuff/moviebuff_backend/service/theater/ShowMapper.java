package com.moviebuff.moviebuff_backend.service.theater;

import com.moviebuff.moviebuff_backend.dto.request.ShowRequest;
import com.moviebuff.moviebuff_backend.dto.response.ShowResponse;
import com.moviebuff.moviebuff_backend.model.show.Show;
import com.moviebuff.moviebuff_backend.repository.interfaces.movie.IMovieRepository;
import com.moviebuff.moviebuff_backend.repository.interfaces.theater.ITheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ShowMapper {

    @Autowired
    private IMovieRepository movieRepository;

    @Autowired
    private ITheaterRepository theaterRepository;

    public Show mapRequestToEntity(ShowRequest request) {
        Show show = new Show();
        show.setMovieId(request.getMovieId());
        show.setTheaterId(request.getTheaterId());
        show.setScreenNumber(request.getScreenNumber());
        show.setShowTime(request.getShowTime());
        show.setLanguage(request.getLanguage());
        show.setExperience(request.getExperience());

        // Map pricing tiers
        Map<String, Show.PricingTier> pricingMap = new HashMap<>();
        request.getPricing().forEach((category, pricing) -> {
            Show.PricingTier pricingTier = Show.PricingTier.builder()
                    .basePrice(pricing.getBasePrice())
                    .additionalCharges(pricing.getAdditionalCharges().stream()
                            .map(charge -> Show.AdditionalCharge.builder()
                                    .type(charge.getType())
                                    .amount(charge.getAmount())
                                    .build())
                            .collect(Collectors.toList()))
                    .finalPrice(pricing.getFinalPrice())
                    .build();
            pricingMap.put(category, pricingTier);
        });
        show.setPricing(pricingMap);

        // Initialize seat availability based on seatLayout
        Map<String, Boolean[]> seatAvailability = new HashMap<>();
        request.getSeatLayout().forEach((category, count) -> {
            Boolean[] seats = new Boolean[count];
            for (int i = 0; i < count; i++) {
                seats[i] = true; // Initially all seats are available
            }
            seatAvailability.put(category, seats);
        });
        show.setSeatAvailability(seatAvailability);

        show.setStatus(Show.ShowStatus.OPEN);

        return show;
    }

    public ShowResponse mapEntityToResponse(Show show) {
        ShowResponse response = new ShowResponse();
        response.setId(show.getId());
        response.setMovieId(show.getMovieId());
        response.setTheaterId(show.getTheaterId());
        response.setScreenNumber(show.getScreenNumber());
        response.setShowTime(show.getShowTime());
        response.setLanguage(show.getLanguage());
        response.setExperience(show.getExperience());

        // Map pricing information
        Map<String, ShowResponse.PricingInfo> pricingMap = new HashMap<>();
        show.getPricing().forEach((category, pricing) -> {
            ShowResponse.PricingInfo pricingInfo = new ShowResponse.PricingInfo(
                    pricing.getBasePrice(),
                    pricing.getAdditionalCharges().stream()
                            .map(charge -> new ShowResponse.AdditionalCharge(
                                    charge.getType(),
                                    charge.getAmount()))
                            .collect(Collectors.toList()),
                    pricing.getFinalPrice());
            pricingMap.put(category, pricingInfo);
        });
        response.setPricing(pricingMap);

        // Map seat availability
        response.setSeatAvailability(show.getSeatAvailability());
        response.setStatus(show.getStatus().name());

        // Fetch and map additional information
        movieRepository.findById(show.getMovieId()).ifPresent(movie -> {
            response.setMovie(new ShowResponse.MovieInfo(
                    movie.getTitle(),
                    movie.getPosterUrl(),
                    movie.getDuration(),
                    movie.getGrade()));
        });

        theaterRepository.findById(show.getTheaterId()).ifPresent(theater -> {
            response.setTheater(new ShowResponse.TheaterInfo(
                    theater.getName(),
                    theater.getLocation().getAddress(),
                    theater.getLocation().getCity()));
        });

        theaterRepository.findById(show.getTheaterId()).ifPresent(theater -> {
            theater.getScreens().stream()
                    .filter(screen -> screen.getScreenNumber().equals(show.getScreenNumber()))
                    .findFirst()
                    .ifPresent(screen -> {
                        response.setScreen(new ShowResponse.ScreenInfo(
                                screen.getScreenName(),
                                screen.getSupportedExperiences()));
                    });
        });

        return response;
    }

    public void updateEntityFromRequest(Show show, ShowRequest request) {
        show.setShowTime(request.getShowTime());
        show.setLanguage(request.getLanguage());
        show.setExperience(request.getExperience());

        // Update pricing
        Map<String, Show.PricingTier> pricingMap = new HashMap<>();
        request.getPricing().forEach((category, pricing) -> {
            Show.PricingTier pricingTier = Show.PricingTier.builder()
                    .basePrice(pricing.getBasePrice())
                    .additionalCharges(pricing.getAdditionalCharges().stream()
                            .map(charge -> Show.AdditionalCharge.builder()
                                    .type(charge.getType())
                                    .amount(charge.getAmount())
                                    .build())
                            .collect(Collectors.toList()))
                    .finalPrice(pricing.getFinalPrice())
                    .build();
            pricingMap.put(category, pricingTier);
        });
        show.setPricing(pricingMap);

        // Don't update seat availability as it could affect existing bookings
    }
}