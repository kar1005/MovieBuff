package com.moviebuff.moviebuff_backend.service.theater;

import java.util.*;
import java.util.stream.Collectors;
import com.moviebuff.moviebuff_backend.dto.request.LocationDTO;
import com.moviebuff.moviebuff_backend.dto.request.ScreenDTO;
import com.moviebuff.moviebuff_backend.dto.request.ScreenRequest;
import com.moviebuff.moviebuff_backend.dto.request.SeatDTO;
import com.moviebuff.moviebuff_backend.dto.request.SeatLayoutRequest;
import com.moviebuff.moviebuff_backend.dto.request.TheaterRequest;
import com.moviebuff.moviebuff_backend.dto.response.LocationResponseDTO;
import com.moviebuff.moviebuff_backend.dto.response.ScreenLayoutResponseDTO;
import com.moviebuff.moviebuff_backend.dto.response.ScreenResponseDTO;
import com.moviebuff.moviebuff_backend.dto.response.SeatInfo;
import com.moviebuff.moviebuff_backend.dto.response.TheaterResponse;
import com.moviebuff.moviebuff_backend.model.theater.Theater;

public class TheaterMapper {
    // Mapping methods for Request to Entity
    public Theater mapRequestToEntity(TheaterRequest request) {
        Theater theater = new Theater();
        theater.setName(request.getName());
        theater.setPhoneNumber(request.getPhoneNumber());
        theater.setEmailAddress(request.getEmailAddress());
        theater.setAmenities(request.getAmenities());
        theater.setDescription(request.getDescription());
        theater.setLocation(mapLocationRequestToEntity(request.getLocation()));
        theater.setScreens(mapScreenRequestsToEntities(request.getScreens()));
        theater.setStatus(Theater.TheaterStatus.ACTIVE);
        theater.setTotalScreens(request.getTotalScreens());
        return theater;
    }

    public Theater.TheaterLocation mapLocationRequestToEntity(LocationDTO locationDTO) {
        Theater.TheaterLocation location = new Theater.TheaterLocation();
        location.setAddress(locationDTO.getAddress());
        location.setCity(locationDTO.getCity());
        location.setState(locationDTO.getState());
        location.setZipCode(locationDTO.getZipCode());
        location.setCoordinates(new double[] {
                locationDTO.getCoordinates().get(0),
                locationDTO.getCoordinates().get(1)
        });
        return location;
    }

    public List<Theater.Screen> mapScreenRequestsToEntities(List<ScreenDTO> screenDTOs) {
        if (screenDTOs == null)
            return new ArrayList<>();
        return screenDTOs.stream()
                .map(this::mapScreenRequestToEntity)
                .collect(Collectors.toList());
    }

    public Theater.Screen mapScreenRequestToEntity(ScreenDTO screenDTO) {
        Theater.Screen screen = new Theater.Screen();
        screen.setScreenNumber(screenDTO.getScreenNumber());
        screen.setScreenName(screenDTO.getScreenName());
        screen.setSupportedExperiences(screenDTO.getSupportedExperiences());
        // Fix: Changed to handle SeatLayoutRequest instead of Map
        screen.setLayout(mapScreenLayoutToEntity((SeatLayoutRequest)screenDTO.getLayout()));
        // Fix: Changed to handle ScreenRequest.ScreenFeatures
        screen.setScreenFeatures(mapScreenFeaturesToEntity((ScreenRequest.ScreenFeatures)screenDTO.getFeatures()));
        screen.setTotalSeats(calculateTotalSeats(screen.getLayout()));
        return screen;
    }

    private Integer calculateTotalSeats(Theater.ScreenLayout layout) {
        if (layout == null || layout.getSections() == null) return 0;
        
        return layout.getSections().stream()
            .flatMap(section -> section.getSeats().stream())
            .filter(seat -> seat.getIsActive())
            .collect(Collectors.toList())
            .size();
    }

   public Theater.ScreenLayout mapScreenLayoutToEntity(SeatLayoutRequest layoutRequest) {
    if (layoutRequest == null) return null;

    Theater.ScreenLayout layout = new Theater.ScreenLayout();
    layout.setTotalRows(layoutRequest.getTotalRows());
    layout.setTotalColumns(layoutRequest.getTotalColumns());
    layout.setSections(mapSectionsToEntity(layoutRequest.getSections()));
    layout.setAisles(mapAislesToEntity(layoutRequest.getAisles()));
    layout.setStairs(mapStairsToEntity(layoutRequest.getStairs()));
    layout.setExits(mapExitsToEntity(layoutRequest.getExits()));
    return layout;
}


// Add mapping method for Sections
public List<Theater.Section> mapSectionsToEntity(List<SeatLayoutRequest.Section> sections) {
    if (sections == null) return new ArrayList<>();
    return sections.stream()
        .map(section -> {
            Theater.Section s = new Theater.Section();
            s.setCategoryName(section.getCategoryName());
            s.setCategoryType(section.getCategoryType());
            s.setBasePrice(section.getBasePrice());
            s.setColor(section.getColor());
            s.setSeats(mapSeatsToEntity(section.getSeats()));
            return s;
        })
        .collect(Collectors.toList());
}

// Add mapping method for Aisles
public List<Theater.Aisle> mapAislesToEntity(List<SeatLayoutRequest.Aisle> aisles) {
    if (aisles == null) return new ArrayList<>();
    return aisles.stream()
        .map(aisle -> {
            Theater.Aisle a = new Theater.Aisle();
            a.setType(aisle.getType());
            a.setPosition(aisle.getPosition());
            a.setStartPosition(aisle.getStartPosition());
            a.setEndPosition(aisle.getEndPosition());
            a.setWidth(aisle.getWidth());
            return a;
        })
        .collect(Collectors.toList());
}

// Add mapping method for Stairs
public List<Theater.Stair> mapStairsToEntity(List<SeatLayoutRequest.Stairs> stairs) {
    if (stairs == null) return new ArrayList<>();
    return stairs.stream()
        .map(stair -> {
            Theater.Stair s = new Theater.Stair();
            s.setType(stair.getType());
            s.setLocation(new Theater.Location(stair.getRow(), stair.getColumn()));
            s.setWidth(stair.getWidth());
            s.setDirection(stair.getDirection());
            return s;
        })
        .collect(Collectors.toList());
}

// Add mapping method for Exits
public List<Theater.Exit> mapExitsToEntity(List<SeatLayoutRequest.Exit> exits) {
    if (exits == null) return new ArrayList<>();
    return exits.stream()
        .map(exit -> {
            Theater.Exit e = new Theater.Exit();
            e.setGateNumber(exit.getGateNumber());
            e.setLocation(new Theater.Location(exit.getRow(), exit.getColumn()));
            e.setType(exit.getType());
            e.setWidth(exit.getWidth());
            return e;
        })
        .collect(Collectors.toList());
}

// Helper method for mapping seats
private List<Theater.Seat> mapSeatsToEntity(List<SeatDTO> seats) {
    if (seats == null) return new ArrayList<>();
    return seats.stream()
        .map(seat -> {
            Theater.Seat s = new Theater.Seat();
            s.setRow(seat.getRow());
            s.setColumn(seat.getColumn());
            s.setSeatNumber(seat.getSeatNumber());
            s.setType(seat.getType());
            s.setIsActive(seat.getIsActive());
            return s;
        })
        .collect(Collectors.toList());
}



// Add method to map screen features
public Theater.ScreenFeatures mapScreenFeaturesToEntity(ScreenRequest.ScreenFeatures features) {
    if (features == null) return null;
    
    Theater.ScreenFeatures screenFeatures = new Theater.ScreenFeatures();
    screenFeatures.setScreenWidth(features.getScreenWidth());
    screenFeatures.setScreenHeight(features.getScreenHeight());
    screenFeatures.setProjectorType(features.getProjectorType());
    screenFeatures.setSoundSystem(features.getSoundSystem());
    return screenFeatures;
}

    public List<Theater.Aisle> mapAislesFromMap(List<Map<String, Object>> aisles) {
        if (aisles == null)
            return new ArrayList<>();
        return aisles.stream().map(aisle -> {
            Theater.Aisle a = new Theater.Aisle();
            a.setType((String) aisle.get("type"));
            a.setPosition((Integer) aisle.get("position"));
            a.setStartPosition((Integer) aisle.get("startPosition"));
            a.setEndPosition((Integer) aisle.get("endPosition"));
            a.setWidth((Integer) aisle.get("width"));
            return a;
        }).collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    public List<Theater.Stair> mapStairsFromMap(List<Map<String, Object>> stairs) {
        if (stairs == null)
            return new ArrayList<>();
        return stairs.stream().map(stair -> {
            Theater.Stair s = new Theater.Stair();
            s.setType((String) stair.get("type"));
            s.setLocation(mapLocation((Map<String, Object>) stair.get("location")));
            s.setWidth((Integer) stair.get("width"));
            s.setDirection((String) stair.get("direction"));
            return s;
        }).collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")

    public List<Theater.Exit> mapExitsFromMap(List<Map<String, Object>> exits) {
        if (exits == null)
            return new ArrayList<>();
        return exits.stream().map(exit -> {
            Theater.Exit e = new Theater.Exit();
            e.setGateNumber((String) exit.get("gateNumber"));
            e.setLocation(mapLocation((Map<String, Object>) exit.get("location")));
            e.setType((String) exit.get("type"));
            e.setWidth((Integer) exit.get("width"));
            return e;
        }).collect(Collectors.toList());
    }

    public Theater.Location mapLocation(Map<String, Object> locationMap) {
        if (locationMap == null)
            return null;
        Theater.Location location = new Theater.Location();
        location.setRow((Integer) locationMap.get("row"));
        location.setColumn((Integer) locationMap.get("column"));
        return location;
    }

    public List<Theater.SeatGap> mapSeatGapsFromMap(List<Map<String, Object>> seatGaps) {
        if (seatGaps == null)
            return new ArrayList<>();
        return seatGaps.stream().map(gap -> {
            Theater.SeatGap g = new Theater.SeatGap();
            g.setRow((Integer) gap.get("row"));
            g.setColumn((Integer) gap.get("column"));
            g.setWidth((Integer) gap.get("width"));
            return g;
        }).collect(Collectors.toList());
    }

    public List<Theater.UnavailableSeat> mapUnavailableSeatsFromMap(List<Map<String, Object>> unavailableSeats) {
        if (unavailableSeats == null)
            return new ArrayList<>();
        return unavailableSeats.stream().map(seat -> {
            Theater.UnavailableSeat u = new Theater.UnavailableSeat();
            u.setRow((Integer) seat.get("row"));
            u.setColumn((Integer) seat.get("column"));
            u.setReason((String) seat.get("reason"));
            return u;
        }).collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")

    // Layout component mapping methods
    public List<Theater.Section> mapSectionsFromMap(List<Map<String, Object>> sections) {
        if (sections == null) return new ArrayList<>();
        return sections.stream().map(section -> {
            Theater.Section s = new Theater.Section();
            s.setCategoryName((String) section.get("categoryName"));
            s.setCategoryType((String) section.get("categoryType"));
            s.setBasePrice((Double) section.get("basePrice"));
            s.setColor((String) section.get("color"));
            s.setSeats(mapSeatsFromMap((List<Map<String, Object>>) section.get("seats")));
            return s;
        }).collect(Collectors.toList());
    }

    public List<Theater.Seat> mapSeatsFromMap(List<Map<String, Object>> seats) {
        if (seats == null) return new ArrayList<>();
        return seats.stream().map(seat -> {
            Theater.Seat s = new Theater.Seat();
            s.setRow((Integer) seat.get("row"));
            s.setColumn((Integer) seat.get("column"));
            s.setSeatNumber((String) seat.get("seatNumber"));
            s.setType((String) seat.get("type"));
            s.setIsActive((Boolean) seat.get("isActive"));
            return s;
        }).collect(Collectors.toList());
    }

    // Entity to Response mapping methods
    public TheaterResponse mapEntityToResponse(Theater theater) {
        TheaterResponse response = new TheaterResponse();
        response.setId(theater.getId());
        response.setName(theater.getName());
        response.setDescription(theater.getDescription());
        response.setLocation(mapLocationToResponse(theater.getLocation()));
        response.setScreens(mapScreensToResponse(theater.getScreens()));
        response.setStatus(theater.getStatus().toString());
        response.setTotalScreens(theater.getTotalScreens());
        response.setPhoneNumber(theater.getPhoneNumber());
        response.setEmailAddress(theater.getEmailAddress());
        response.setAmenities(theater.getAmenities());
        return response;
    }

    public LocationResponseDTO mapLocationToResponse(Theater.TheaterLocation location) {
        LocationResponseDTO responseDTO = new LocationResponseDTO();
        responseDTO.setAddress(location.getAddress());
        responseDTO.setCity(location.getCity());
        responseDTO.setState(location.getState());
        responseDTO.setZipCode(location.getZipCode());
        responseDTO.setCoordinates(Arrays.asList(location.getCoordinates()[0], location.getCoordinates()[1]));
        return responseDTO;
    }

    public List<ScreenResponseDTO> mapScreensToResponse(List<Theater.Screen> screens) {
        if (screens == null)
            return new ArrayList<>();
        return screens.stream()
                .map(this::mapScreenToResponse)
                .collect(Collectors.toList());
    }

    public ScreenResponseDTO mapScreenToResponse(Theater.Screen screen) {
        ScreenResponseDTO responseDTO = new ScreenResponseDTO();
        responseDTO.setScreenNumber(screen.getScreenNumber());
        responseDTO.setScreenName(screen.getScreenName());
        responseDTO.setSupportedExperiences(screen.getSupportedExperiences());
        responseDTO.setLayout(mapLayoutToResponse(screen.getLayout()));
        responseDTO.setFeatures(mapScreenFeaturesToResponse(screen.getScreenFeatures()));
        responseDTO.setTotalSeats(screen.getTotalSeats());
        responseDTO.setIsActive(true); // Default to true for new screens
        responseDTO.setStatus("OPERATIONAL"); // Default status
        return responseDTO;
    }

    public ScreenResponseDTO.ScreenFeaturesResponse mapScreenFeaturesToResponse(Theater.ScreenFeatures features) {
        if (features == null) return null;
        
        ScreenResponseDTO.ScreenFeaturesResponse response = new ScreenResponseDTO.ScreenFeaturesResponse();
        response.setScreenWidth(features.getScreenWidth());
        response.setScreenHeight(features.getScreenHeight());
        response.setProjectorType(features.getProjectorType());
        response.setSoundSystem(features.getSoundSystem());
        return response;
    }
    
public ScreenLayoutResponseDTO mapLayoutToResponse(Theater.ScreenLayout layout) {
    if (layout == null) return null;

    ScreenLayoutResponseDTO responseDTO = new ScreenLayoutResponseDTO();
    responseDTO.setTotalRows(layout.getTotalRows());
    responseDTO.setTotalColumns(layout.getTotalColumns());
    
    // Map seats for client display
    List<SeatInfo> seatInfoList = layout.getSections().stream()
        .flatMap(section -> section.getSeats().stream()
            .map(seat -> new SeatInfo(
                seat.getSeatNumber(),
                seat.getRow(),
                seat.getColumn(),
                section.getCategoryName(),
                section.getCategoryType(),
                section.getBasePrice(),
                seat.getType(),
                seat.getIsActive(),
                true, // isAvailable (for initial layout)
                null  // unavailableReason
            )))
        .collect(Collectors.toList());
    
    responseDTO.setSeats(seatInfoList);
    return responseDTO;
}
}
