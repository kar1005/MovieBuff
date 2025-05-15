import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Modal, Form } from "react-bootstrap";
import { MapPin } from "lucide-react";
import { toast } from "react-toastify";
import {
  setLocation,
  selectUserCity,
  selectIsLocationSet,
} from "../../../redux/slices/locationSlice";
import "./LocationSelector.css";

function LocationSelector() {
  const dispatch = useDispatch();
  const storedCity = useSelector(selectUserCity);
  const isLocationSet = useSelector(selectIsLocationSet);

  // Initialize showModal based on whether location is set
  const [showModal, setShowModal] = useState(!isLocationSet);
  const [userCity, setUserCity] = useState(storedCity || "Select City");
  const [cityInput, setCityInput] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationData, setLocationData] = useState({
    coordinates: null,
    googleLink: "",
    city: "",
  });
  const [popularCities] = useState([
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Hyderabad",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
  ]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [allCities, setAllCities] = useState([]);

  const handleShow = () => setShowModal(true);
  const handleClose = () => {
    // Only allow closing if location is already set
    if (isLocationSet) {
      setShowModal(false);
      setShowAllCities(false);
      setCitySuggestions([]);
      setCityInput("");
    }
  };

  const handleCitySelection = (city) => {
    setUserCity(city);

    // Dispatch to Redux store
    dispatch(
      setLocation({
        city: city,
        coordinates: locationData.coordinates,
      })
    );

    // Now that location is set, we can close the modal
    setShowModal(false);
    setShowAllCities(false);
    setCitySuggestions([]);
    setCityInput("");
  };

  const handleManualCitySelection = () => {
    if (cityInput.trim()) {
      handleCitySelection(cityInput);
    }
  };

  const handleLocationChange = (field, value) => {
    setLocationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const detectUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationDetected(false);
    setLocationError("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationChange("coordinates", [latitude, longitude]);

          // Generate Google Maps link
          const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          handleLocationChange("googleLink", mapsLink.toString());

          // Fetch city name using coordinates
          fetchCityFromCoords(latitude, longitude);
        },
        (error) => {
          setIsLoadingLocation(false);
          setLocationError(
            "Location permission denied. Please select your city manually."
          );
          toast.error("Failed to get location: " + error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLoadingLocation(false);
      setLocationError(
        "Geolocation is not supported by your browser. Please select your city manually."
      );
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const fetchCityFromCoords = async (latitude, longitude) => {
    try {
      // OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );

      if (!response.ok) throw new Error("Failed to fetch city data");

      const data = await response.json();
      const city =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        "Unknown";

      if (city !== "Unknown") {
        handleLocationChange("city", city);

        // Dispatch to Redux store with coordinates
        dispatch(
          setLocation({
            city: city,
            coordinates: [latitude, longitude],
          })
        );

        setUserCity(city);
        setLocationDetected(true);

        // Stop the loading immediately when we have the data
        setIsLoadingLocation(false);

        // Close modal after successful location detection
        setTimeout(() => {
          setShowModal(false);
        }, 1000);

        return;
      }

      // Fallback if city not found
      throw new Error("Could not determine city from coordinates");
    } catch (error) {
      console.error("Geocoding service failed:", error);
      setLocationError("Could not determine your precise location");
      setIsLoadingLocation(false);
    }
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Function to fetch city suggestions as user types
  const fetchCitySuggestions = useCallback(
    debounce(async (input) => {
      if (!input.trim() || input.length < 2) {
        setCitySuggestions([]);
        return;
      }

      setIsLoadingCities(true);
      try {
        const response = await fetch(
          "https://countriessnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ country: "India" }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();
        if (!data.error && Array.isArray(data.data)) {
          // Filter cities that include the input (case insensitive)
          const filteredCities = data.data
            .filter((city) => city.toLowerCase().includes(input.toLowerCase()))
            .slice(0, 5); // Limit to 5 suggestions

          setCitySuggestions(filteredCities);

          // Store all cities for "Show All" feature
          setAllCities(data.data);
        }
      } catch (error) {
        console.error("Error fetching city suggestions:", error);
        // toast.error('Failed to load city suggestions');
      } finally {
        setIsLoadingCities(false);
      }
    }, 300),
    []
  );

  // Handle input change and fetch suggestions
  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setCityInput(value);
    fetchCitySuggestions(value);
  };

  // Function to toggle showing all cities
  const handleShowAllCities = async () => {
    setShowAllCities(true);

    // If we don't already have all cities, fetch them
    if (allCities.length === 0) {
      setIsLoadingCities(true);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ country: "India" }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();
        if (!data.error && Array.isArray(data.data)) {
          setAllCities(data.data);
        }
      } catch (error) {
        console.error("Error fetching all cities:", error);
        toast.error("Failed to load cities");
      } finally {
        setIsLoadingCities(false);
      }
    }
  };

  // Filter cities in the "All Cities" view
  const filteredAllCities = cityInput.trim()
    ? allCities.filter((city) =>
        city.toLowerCase().includes(cityInput.toLowerCase())
      )
    : allCities;

  // Only set user city from stored value, don't automatically open modal here
  useEffect(() => {
    if (storedCity) {
      setUserCity(storedCity);
    }
  }, [storedCity]);

  // This effect will update the modal state in response to isLocationSet changes
  useEffect(() => {
    setShowModal(!isLocationSet);
  }, [isLocationSet]);

  return (
    <>
      <div className="location-wrapper">
        <Button
          variant="outline-light"
          onClick={handleShow}
          className="location-selector-button"
        >
          <MapPin size={16} className="location-icon" />
          <span className="location-text">{userCity}</span>
        </Button>

        {/* Location Modal - Non-dismissible when location not set */}
        <Modal
          show={showModal}
          onHide={handleClose}
          backdrop="static"
          keyboard={isLocationSet}
          centered
          size={showAllCities ? "lg" : "md"}
          className="location-modal"
        >
          <Modal.Header
            closeButton={isLocationSet}
            className="location-modal-header"
          >
            <Modal.Title>
              {showAllCities ? "All Cities" : "Select Your Location"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {showAllCities ? (
              <div className="all-cities-container">
                {/* Improved search bar in All Cities view */}
                <div className="city-search-wrapper mb-3">
                  <div className="position-relative">
                    <MapPin className="search-icon-city" size={16} />
                    <Form.Control
                      type="text"
                      placeholder="Search for cities"
                      className="city-search-input"
                      value={cityInput}
                      onChange={handleCityInputChange}
                      autoComplete="off"
                    />
                    {isLoadingCities && (
                      <div className="loading-indicator">
                        <div className="loading-spinner"></div>
                      </div>
                    )}
                  </div>
                </div>

                {isLoadingCities && !filteredAllCities.length ? (
                  <div className="text-center my-4">
                    <div className="single-spinner-container">
                      <div className="single-spinner"></div>
                    </div>
                    <p className="mt-3 text-muted">Loading cities...</p>
                  </div>
                ) : filteredAllCities.length > 0 ? (
                  <div className="all-cities-grid">
                    {filteredAllCities.map((city, index) => (
                      <Button
                        key={index}
                        variant="light"
                        className="city-button"
                        onClick={() => handleCitySelection(city)}
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center my-4">
                    <p className="text-muted">
                      No cities found matching your search.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!isLocationSet && (
                  <div className="mb-3">
                    <p>
                      To provide you with the best movie experience, we need to
                      know your location.
                    </p>
                    <p>Please select your city to continue.</p>
                  </div>
                )}

                <Button
                  variant="outline-primary"
                  onClick={detectUserLocation}
                  className="detect-location-btn mb-3 w-100"
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <>
                      <div className="single-spinner-small me-2"></div>
                      Detecting your location...
                    </>
                  ) : (
                    <>
                      <MapPin size={16} className="me-2" />
                      Detect my current location
                    </>
                  )}
                </Button>

                {locationError && (
                  <div className="alert alert-warning">{locationError}</div>
                )}

                {locationDetected && (
                  <div className="alert alert-success">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        Location detected! Selected city:{" "}
                        <strong>{locationData.city}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {locationData.googleLink &&
                  !locationDetected &&
                  !isLoadingLocation && (
                    <div className="location-preview mb-3">
                      <small className="text-muted d-block mb-1">
                        Your detected location:
                      </small>

                      <a
                        href={locationData.googleLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-flex align-items-center text-primary"
                      >
                        <MapPin size={16} className="me-1" />
                        {locationData.city || "View on map"}
                      </a>
                    </div>
                  )}

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="popular-cities-heading mb-0">
                    Popular Cities
                  </h6>
                  <Button
                    variant="link"
                    className="show-all-cities-btn p-0"
                    onClick={handleShowAllCities}
                    disabled={isLoadingCities}
                  >
                    Show All Cities
                  </Button>
                </div>

                <div className="popular-cities-grid">
                  {popularCities.map((city, index) => (
                    <Button
                      key={index}
                      variant="light"
                      className="city-button"
                      onClick={() => handleCitySelection(city)}
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            {showAllCities ? (
              <Button
                variant="secondary"
                onClick={() => setShowAllCities(false)}
              >
                Back
              </Button>
            ) : (
              <>
                {isLocationSet && (
                  <Button variant="secondary" onClick={handleClose}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleManualCitySelection}
                  disabled={!cityInput.trim()}
                >
                  Select
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}

export default LocationSelector;
