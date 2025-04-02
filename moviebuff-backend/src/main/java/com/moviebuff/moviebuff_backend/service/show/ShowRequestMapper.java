package com.moviebuff.moviebuff_backend.service.show;

import com.moviebuff.moviebuff_backend.dto.request.ShowRequest;
import com.moviebuff.moviebuff_backend.model.show.Show;
import com.moviebuff.moviebuff_backend.model.theater.Theater;
import com.moviebuff.moviebuff_backend.repository.interfaces.theater.ITheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class ShowRequestMapper {

    private final ITheaterRepository theaterRepository;

    @Autowired
    public ShowRequestMapper(ITheaterRepository theaterRepository) {
        this.theaterRepository = theaterRepository;
    }

    public Show mapToEntity(ShowRequest request) {
        if (request == null) return null;

        Show show = new Show();
        show.setMovieId(request.getMovieId());
        show.setTheaterId(request.getTheaterId());
        show.setScreenNumber(request.getScreenNumber());
        show.setShowTime(request.getShowTime());
        show.setLanguage(request.getLanguage());
        show.setExperience(request.getExperience());

        // Map pricing information
        if (request.getPricing() != null) {
            Map<String, Show.PricingTier> pricingMap = new HashMap<>();
            request.getPricing().forEach((category, pricing) -> {
                Show.PricingTier pricingTier = Show.PricingTier.builder()
                        .categoryName(category)
                        .basePrice(pricing.getBasePrice())
                        .finalPrice(pricing.getFinalPrice())
                        .build();

                if (pricing.getAdditionalCharges() != null) {
                    pricingTier.setAdditionalCharges(pricing.getAdditionalCharges().stream()
                            .map(charge -> Show.AdditionalCharge.builder()
                                    .type(charge.getType())
                                    .amount(charge.getAmount())
                                    .isPercentage(charge.getIsPercentage())
                                    .build())
                            .collect(Collectors.toList()));
                }

                pricingMap.put(category, pricingTier);
            });
            show.setPricing(pricingMap);
        }

        // Initialize seat status based on theater screen layout
        Theater theater = theaterRepository.findById(request.getTheaterId()).orElse(null);
        if (theater != null) {
            Theater.Screen screen = theater.getScreens().stream()
                    .filter(s -> s.getScreenNumber().equals(request.getScreenNumber()))
                    .findFirst()
                    .orElse(null);

            if (screen != null && screen.getLayout() != null && screen.getLayout().getSections() != null) {
                List<Show.SeatStatus> seatStatusList = new ArrayList<>();

                for (Theater.Section section : screen.getLayout().getSections()) {
                    if (section.getSeats() != null) {
                        for (Theater.Seat seat : section.getSeats()) {
                            if (Boolean.TRUE.equals(seat.getIsActive())) {
                                Show.SeatStatus seatStatus = Show.SeatStatus.builder()
                                        .seatId(seat.getSeatNumber())
                                        .row(seat.getRow())
                                        .column(seat.getColumn())
                                        .category(section.getCategoryName())
                                        .status(Show.SeatAvailability.AVAILABLE)
                                        .lastUpdated(LocalDateTime.now())
                                        .build();
                                seatStatusList.add(seatStatus);
                            }
                        }
                    }
                }

                show.setSeatStatus(seatStatusList);
                
                // Set total seats
                show.setTotalSeats(seatStatusList.size());
                show.setAvailableSeats(seatStatusList.size());
                show.setBookedSeats(0);
            }
        }

        // Initialize other fields
        show.setViewCount(0);
        show.setBookingAttempts(0);
        show.setPopularityScore(0.0);
        show.setStatus(Show.ShowStatus.OPEN);
        show.setCreatedAt(LocalDateTime.now());
        show.setUpdatedAt(LocalDateTime.now());

        return show;
    }

    public void updateEntityFromRequest(Show show, ShowRequest request) {
        if (show == null || request == null) return;

        // Update basic fields
        show.setShowTime(request.getShowTime());
        show.setLanguage(request.getLanguage());
        show.setExperience(request.getExperience());

        // Update pricing information
        if (request.getPricing() != null) {
            Map<String, Show.PricingTier> pricingMap = new HashMap<>();
            request.getPricing().forEach((category, pricing) -> {
                Show.PricingTier pricingTier = Show.PricingTier.builder()
                        .categoryName(category)
                        .basePrice(pricing.getBasePrice())
                        .finalPrice(pricing.getFinalPrice())
                        .build();

                if (pricing.getAdditionalCharges() != null) {
                    pricingTier.setAdditionalCharges(pricing.getAdditionalCharges().stream()
                            .map(charge -> Show.AdditionalCharge.builder()
                                    .type(charge.getType())
                                    .amount(charge.getAmount())
                                    .isPercentage(charge.getIsPercentage())
                                    .build())
                            .collect(Collectors.toList()));
                }

                pricingMap.put(category, pricingTier);
            });
            show.setPricing(pricingMap);
        }

        // Don't update seat status as it could affect existing bookings
        
        // Update timestamp
        show.setUpdatedAt(LocalDateTime.now());
    }
}