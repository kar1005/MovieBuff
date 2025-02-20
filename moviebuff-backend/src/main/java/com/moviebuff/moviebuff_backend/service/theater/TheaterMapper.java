package com.moviebuff.moviebuff_backend.service.theater;

import com.moviebuff.moviebuff_backend.dto.request.*;
import com.moviebuff.moviebuff_backend.dto.response.TheaterResponse;
import com.moviebuff.moviebuff_backend.model.theater.Theater;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class TheaterMapper {

    // Convert Theater Entity to TheaterResponse DTO
    public TheaterResponse toTheaterResponse(Theater theater) {

        TheaterResponse response = new TheaterResponse();
        response.setId(theater.getId());
        response.setName(theater.getName());
        response.setAmenities(theater.getAmenities());
        response.setDescription(theater.getDescription());
        response.setEmailAddress(theater.getEmailAddress());
        response.setPhoneNumber(theater.getPhoneNumber());
        response.setTotalScreens(theater.getTotalScreens());
        response.setStatus(theater.getStatus().toString());

        // Map Location
        if (theater.getLocation() != null) {
            LocationDTO locationDTO = new LocationDTO();
            locationDTO.setAddress(theater.getLocation().getAddress());
            locationDTO.setCity(theater.getLocation().getCity());
            locationDTO.setState(theater.getLocation().getState());
            locationDTO.setZipCode(theater.getLocation().getZipCode());
            if (theater.getLocation().getCoordinates() != null) {
                locationDTO.setCoordinates(List.of(
                        theater.getLocation().getCoordinates()[0],
                        theater.getLocation().getCoordinates()[1]));
                locationDTO.setGoogleLink(theater.getLocation().getGoogleLink());
                response.setLocation(locationDTO);
            }

            // Map Screens
            if (theater.getScreens() != null) {
                response.setScreens(theater.getScreens().stream()
                        .map(this::toScreenDTO)
                        .collect(Collectors.toList()));
            }

            // Calculate and set theater stats
            TheaterResponse.TheaterStats stats = calculateTheaterStats(theater);
            response.setStats(stats);

        }
        return response;
    }

    // Convert TheaterRequest DTO to Theater Entity
    public Theater toTheater(TheaterRequest request) {
        if (request == null)
            return null;

        return Theater.builder()
                .name(request.getName())
                .managerId(request.getManagerId())
                .amenities(request.getAmenities())
                .description(request.getDescription())
                .emailAddress(request.getEmailAddress())
                .phoneNumber(request.getPhoneNumber())
                .totalScreens(request.getTotalScreens())
                .location(toTheaterLocation(request.getLocation()))
                .screens(request.getScreens() != null ? request.getScreens().stream()
                        .map(this::toScreen)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .status(Theater.TheaterStatus.ACTIVE)
                .build();
    }

    // Helper method to calculate theater statistics
    private TheaterResponse.TheaterStats calculateTheaterStats(Theater theater) {

        int totalSeats = 0;
        int availableSeats = 0;
        int activeScreens = 0;

        if (theater.getScreens() != null) {

            for (Theater.Screen screen : theater.getScreens()) {

                // if (Boolean.TRUE.equals(screen.getIsActive())) {

                activeScreens++;
                if (screen.getTotalSeats() != null) {

                    totalSeats += screen.getTotalSeats();
                }
                if (screen.getAvailableSeats() != null) {
                    availableSeats += screen.getAvailableSeats();
                }
                // }
            }
        }

        double occupancyRate = totalSeats > 0 ? ((double) (totalSeats - availableSeats) / totalSeats) * 100 : 0.0;

        return new TheaterResponse.TheaterStats(
                totalSeats,
                availableSeats,
                activeScreens,
                0, // totalShowsToday will be set by service layer
                occupancyRate);
    }

    // Convert LocationDTO to TheaterLocation
    private Theater.TheaterLocation toTheaterLocation(LocationDTO locationDTO) {
        if (locationDTO == null)
            return null;

        return Theater.TheaterLocation.builder()
                .coordinates(locationDTO.getCoordinates() != null && locationDTO.getCoordinates().size() == 2
                        ? new double[] { locationDTO.getCoordinates().get(0), locationDTO.getCoordinates().get(1) }
                        : new double[] { 0.0, 0.0 })
                .address(locationDTO.getAddress())
                .city(locationDTO.getCity())
                .state(locationDTO.getState())
                .zipCode(locationDTO.getZipCode())
                .googleLink(locationDTO.getGoogleLink())
                .build();
    }

    // Convert Screen to ScreenDTO
    ScreenDTO toScreenDTO(Theater.Screen screen) {
        if (screen == null)
            return null;

        ScreenDTO dto = new ScreenDTO();
        dto.setScreenNumber(screen.getScreenNumber());
        dto.setScreenName(screen.getScreenName());
        dto.setSupportedExperiences(screen.getSupportedExperiences());
        dto.setTotalSeats(screen.getTotalSeats());
        dto.setIsActive(screen.getIsActive());
        dto.setAvailableSeats(screen.getAvailableSeats());

        // Map screen features
        if (screen.getScreenFeatures() != null) {
            ScreenDTO.ScreenFeatures features = new ScreenDTO.ScreenFeatures();
            features.setScreenWidth(screen.getScreenFeatures().getScreenWidth());
            features.setScreenHeight(screen.getScreenFeatures().getScreenHeight());
            features.setProjectorType(screen.getScreenFeatures().getProjectorType());
            features.setSoundSystem(screen.getScreenFeatures().getSoundSystem());
            dto.setFeatures(features);
        }

        // Map layout
        if (screen.getLayout() != null) {
            dto.setLayout(toSeatLayoutDTO(screen.getLayout()));
        }

        return dto;
    }

    // Convert ScreenDTO to Screen
    Theater.Screen toScreen(ScreenDTO dto) {
        if (dto == null)
            return null;

        return Theater.Screen.builder()
                .screenNumber(dto.getScreenNumber())
                .screenName(dto.getScreenName())
                .supportedExperiences(dto.getSupportedExperiences())
                .layout(toScreenLayout(dto.getLayout()))
                .screenFeatures(toScreenFeatures(dto.getFeatures()))
                .totalSeats(dto.getTotalSeats())
                .isActive(dto.getIsActive())
                .availableSeats(dto.getAvailableSeats())
                .build();
    }

    // Convert ScreenFeatures DTO to ScreenFeatures
    private Theater.ScreenFeatures toScreenFeatures(ScreenDTO.ScreenFeatures features) {
        if (features == null)
            return null;

        return Theater.ScreenFeatures.builder()
                .screenWidth(features.getScreenWidth())
                .screenHeight(features.getScreenHeight())
                .projectorType(features.getProjectorType())
                .soundSystem(features.getSoundSystem())
                .build();
    }

    // Convert SeatLayoutDTO to ScreenLayout
    private Theater.ScreenLayout toScreenLayout(SeatLayoutDTO dto) {
        if (dto == null)
            return null;

        return Theater.ScreenLayout.builder()
                .totalRows(dto.getTotalRows())
                .totalColumns(dto.getTotalColumns())
                .sections(dto.getSections() != null ? dto.getSections().stream()
                        .map(this::toSection)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .aisles(dto.getAisles() != null ? dto.getAisles().stream()
                        .map(this::toAisle)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .stairs(dto.getStairs() != null ? dto.getStairs().stream()
                        .map(this::toStair)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .exits(dto.getExits() != null ? dto.getExits().stream()
                        .map(this::toExit)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .seatGaps(dto.getSeatGaps() != null ? dto.getSeatGaps().stream()
                        .map(this::toSeatGap)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .unavailableSeats(dto.getUnavailableSeats() != null ? dto.getUnavailableSeats().stream()
                        .map(this::toUnavailableSeat)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }

    // Convert ScreenLayout to SeatLayoutDTO
    private SeatLayoutDTO toSeatLayoutDTO(Theater.ScreenLayout layout) {
        if (layout == null)
            return null;

        SeatLayoutDTO dto = new SeatLayoutDTO();
        dto.setTotalRows(layout.getTotalRows());
        dto.setTotalColumns(layout.getTotalColumns());

        if (layout.getSections() != null) {
            dto.setSections(layout.getSections().stream()
                    .map(this::toSectionDTO)
                    .collect(Collectors.toList()));
        }

        if (layout.getAisles() != null) {
            dto.setAisles(layout.getAisles().stream()
                    .map(this::toAisleDTO)
                    .collect(Collectors.toList()));
        }

        if (layout.getStairs() != null) {
            dto.setStairs(layout.getStairs().stream()
                    .map(this::toStairsDTO)
                    .collect(Collectors.toList()));
        }

        if (layout.getExits() != null) {
            dto.setExits(layout.getExits().stream()
                    .map(this::toExitDTO)
                    .collect(Collectors.toList()));
        }

        if (layout.getSeatGaps() != null) {
            dto.setSeatGaps(layout.getSeatGaps().stream()
                    .map(this::toSeatGapDTO)
                    .collect(Collectors.toList()));
        }

        if (layout.getUnavailableSeats() != null) {
            dto.setUnavailableSeats(layout.getUnavailableSeats().stream()
                    .map(this::toUnavailableSeatDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // Helper methods for converting individual components
    private Theater.Section toSection(SeatLayoutDTO.Section dto) {
        if (dto == null)
            return null;

        return Theater.Section.builder()
                .categoryName(dto.getCategoryName())
                .categoryType(dto.getCategoryType())
                .basePrice(dto.getBasePrice())
                .color(dto.getColor())
                .seats(dto.getSeats() != null ? dto.getSeats().stream()
                        .map(this::toSeat)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }

    private SeatLayoutDTO.Section toSectionDTO(Theater.Section section) {
        if (section == null)
            return null;

        SeatLayoutDTO.Section dto = new SeatLayoutDTO.Section();
        dto.setCategoryName(section.getCategoryName());
        dto.setCategoryType(section.getCategoryType());
        dto.setBasePrice(section.getBasePrice());
        dto.setColor(section.getColor());

        if (section.getSeats() != null) {
            dto.setSeats(section.getSeats().stream()
                    .map(this::toSeatDTO)
                    .collect(Collectors.toList()));
            dto.setTotalSeats(section.getSeats().size());
        }

        return dto;
    }

    private Theater.Seat toSeat(SeatDTO dto) {
        if (dto == null)
            return null;

        return Theater.Seat.builder()
                .seatNumber(dto.getSeatNumber())
                .row(dto.getRow())
                .column(dto.getColumn())
                .type(dto.getType())
                .isActive(dto.getIsActive())
                .build();
    }

    private SeatDTO toSeatDTO(Theater.Seat seat) {
        if (seat == null)
            return null;

        SeatDTO dto = new SeatDTO();
        dto.setSeatNumber(seat.getSeatNumber());
        dto.setRow(seat.getRow());
        dto.setColumn(seat.getColumn());
        dto.setType(seat.getType());
        dto.setIsActive(seat.getIsActive());
        return dto;
    }

    // Mapping methods for Aisle, Stairs, Exit, SeatGap, and UnavailableSeat
    private Theater.Aisle toAisle(SeatLayoutDTO.Aisle dto) {
        if (dto == null)
            return null;

        return Theater.Aisle.builder()
                .type(dto.getType())
                .position(dto.getPosition())
                .startPosition(dto.getStartPosition())
                .endPosition(dto.getEndPosition())
                .width(dto.getWidth())
                .build();
    }

    private SeatLayoutDTO.Aisle toAisleDTO(Theater.Aisle aisle) {
        if (aisle == null)
            return null;

        SeatLayoutDTO.Aisle dto = new SeatLayoutDTO.Aisle();
        dto.setType(aisle.getType());
        dto.setPosition(aisle.getPosition());
        dto.setStartPosition(aisle.getStartPosition());
        dto.setEndPosition(aisle.getEndPosition());
        dto.setWidth(aisle.getWidth());
        return dto;
    }

    private Theater.Stair toStair(SeatLayoutDTO.Stairs dto) {
        if (dto == null)
            return null;

        return Theater.Stair.builder()
                .type(dto.getType())
                .location(Theater.Location.builder()
                        .row(dto.getRow())
                        .column(dto.getColumn())
                        .build())
                .width(dto.getWidth())
                .direction(dto.getDirection())
                .build();
    }

    private SeatLayoutDTO.Stairs toStairsDTO(Theater.Stair stair) {
        if (stair == null)
            return null;

        SeatLayoutDTO.Stairs dto = new SeatLayoutDTO.Stairs();
        dto.setType(stair.getType());
        if (stair.getLocation() != null) {
            dto.setRow(stair.getLocation().getRow());
            dto.setColumn(stair.getLocation().getColumn());
        }
        dto.setWidth(stair.getWidth());
        dto.setDirection(stair.getDirection());
        return dto;
    }

    private Theater.Exit toExit(SeatLayoutDTO.Exit dto) {
        if (dto == null)
            return null;

        return Theater.Exit.builder()
                .gateNumber(dto.getGateNumber())
                .location(Theater.Location.builder()
                        .row(dto.getRow())
                        .column(dto.getColumn())
                        .build())
                .type(dto.getType())
                .width(dto.getWidth())
                .build();
    }

    private SeatLayoutDTO.Exit toExitDTO(Theater.Exit exit) {
        if (exit == null)
            return null;

        SeatLayoutDTO.Exit dto = new SeatLayoutDTO.Exit();
        dto.setGateNumber(exit.getGateNumber());
        if (exit.getLocation() != null) {
            dto.setRow(exit.getLocation().getRow());
            dto.setColumn(exit.getLocation().getColumn());
        }
        dto.setType(exit.getType());
        dto.setWidth(exit.getWidth());
        return dto;
    }

    private Theater.SeatGap toSeatGap(SeatLayoutDTO.SeatGap dto) {
        if (dto == null)
            return null;

        return Theater.SeatGap.builder()
                .row(dto.getRow())
                .column(dto.getColumn())
                .width(dto.getWidth())
                .build();
    }

    private SeatLayoutDTO.SeatGap toSeatGapDTO(Theater.SeatGap seatGap) {
        if (seatGap == null)
            return null;

        SeatLayoutDTO.SeatGap dto = new SeatLayoutDTO.SeatGap();
        dto.setRow(seatGap.getRow());
        dto.setColumn(seatGap.getColumn());
        dto.setWidth(seatGap.getWidth());
        return dto;
    }

    private Theater.UnavailableSeat toUnavailableSeat(SeatLayoutDTO.UnavailableSeat dto) {
        if (dto == null)
            return null;

        return Theater.UnavailableSeat.builder()
                .row(dto.getRow())
                .column(dto.getColumn())
                .reason(dto.getReason())
                .build();
    }

    private SeatLayoutDTO.UnavailableSeat toUnavailableSeatDTO(Theater.UnavailableSeat unavailableSeat) {
        if (unavailableSeat == null)
            return null;

        SeatLayoutDTO.UnavailableSeat dto = new SeatLayoutDTO.UnavailableSeat();
        dto.setRow(unavailableSeat.getRow());
        dto.setColumn(unavailableSeat.getColumn());
        dto.setReason(unavailableSeat.getReason());
        return dto;
    }
}