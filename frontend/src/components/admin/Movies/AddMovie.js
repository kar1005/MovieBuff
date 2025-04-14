// src/components/Movies/AddMovie.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "react-bootstrap";
import { Search, Plus, X } from "lucide-react";
import { createMovie } from "../../../redux/slices/adminSlice";
import actorService from "../../../services/actorService";
import cloudinaryService from "../../../services/cloudinaryService";
import LanguageSelector from "../common/LanguageSelector";

import "./AddMovie.css";

const AddMovie = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error: submitError } = useSelector(
    (state) => state.admin.movies
  );

  const DEFAULT_ACTOR_IMAGE = "https://via.placeholder.com/150?text=Actor";

  const initialFormState = {
    title: "",
    languages: [],
    genres: [],
    experience: [],
    cast: [],
    description: "",
    duration: "",
    grade: "",
    releaseDate: "",
    posterUrl: "",
    trailerUrl: "",
    status: "UPCOMING",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actorSearch, setActorSearch] = useState("");
  const [actorResults, setActorResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [updatingActors, setUpdatingActors] = useState(false);

  // Handle actor search
  useEffect(() => {
    const searchActors = async () => {
      if (actorSearch.trim().length < 2) {
        setActorResults([]);
        return;
      }

      setSearching(true);
      try {
        const results = await actorService.searchActors(actorSearch);
        setActorResults(results);
      } catch (err) {
        console.error("Error searching actors:", err);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchActors, 300);
    return () => clearTimeout(timeoutId);
  }, [actorSearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayInput = (e, field) => {
    const value = e.target.value.split(",").map((item) => item.trim());
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    try {
      const result = await cloudinaryService.uploadImage(file, "movie-posters");
      console.log("PosterUrl: " + JSON.stringify(result));
      
      setFormData((prev) => ({
        ...prev,
        posterUrl: result.url,
      }));
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setImageLoading(false);
    }
  };

  // If you need optimized URLs for display
  const getOptimizedPosterUrl = (url) => {
    return cloudinaryService.getOptimizedUrl(url, {
      width: 300,
      height: 450,
      quality: "auto",
    });
  };

  const handleActorSelect = async (actor) => {
    // If actor exists, add them to cast
    const newCastMember = {
      actorId: actor.id,
      name: actor.name,
      imageUrl: actor.imageUrl || DEFAULT_ACTOR_IMAGE,
      characterName: "",
      role: "SUPPORTING",
    };

    setFormData((prev) => ({
      ...prev,
      cast: [...prev.cast, newCastMember],
    }));

    setActorSearch("");
    setActorResults([]);
  };

  const handleCreateNewActor = async () => {
    try {
      const newActor = await actorService.createActor({
        name: actorSearch,
        imageUrl: DEFAULT_ACTOR_IMAGE,
        isProfile: false,
      });

      handleActorSelect(newActor);
    } catch (err) {
      setError("Failed to create new actor");
    }
  };

  const updateCastMember = (index, field, value) => {
    const updatedCast = [...formData.cast];
    updatedCast[index] = { ...updatedCast[index], [field]: value };
    setFormData((prev) => ({ ...prev, cast: updatedCast }));
  };

  const removeCastMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      cast: prev.cast.filter((_, i) => i !== index),
    }));
  };

  // Helper function to update actors' filmography
  const updateActorsFilmography = async (createdMovie) => {
    try {
      setUpdatingActors(true);
      
      // For each cast member, update their filmography
      const updatePromises = formData.cast.map(async (castMember) => {
        try {
          // First get current actor data
          const actor = await actorService.getActorById(castMember.actorId);
          
          // Create movie appearance object
          const movieAppearance = {
            movieId: createdMovie.id,
            movieTitle: createdMovie.title,
            characterName: castMember.characterName,
            role: castMember.role,
            releaseDate: createdMovie.releaseDate ? new Date(createdMovie.releaseDate).toISOString() : null,
            movieRating: 0 // Default rating for new movie
          };
          
          // Prepare updated filmography
          const currentFilmography = actor.filmography || [];
          const updatedFilmography = [...currentFilmography, movieAppearance];
          
          // Update the actor's filmography
          return actorService.updateFilmography(castMember.actorId, updatedFilmography);
        } catch (error) {
          console.error(`Failed to update actor ${castMember.name}'s filmography:`, error);
          // Continue with other actors even if one fails
          return null;
        }
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error updating actors' filmography:", error);
      // We don't want to fail the whole operation if this step fails
    } finally {
      setUpdatingActors(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.posterUrl) {
      setError("Please upload a poster image");
      return;
    }

    try {
      // First create the movie
      const createdMovie = await dispatch(createMovie(formData)).unwrap();
      
      // Then update actors' filmography
      await updateActorsFilmography(createdMovie);
      
      // Navigate away
      navigate("/admin/movies");
    } catch (err) {
      setError(err.message || "Failed to create movie");
    }
  };

  const renderPosterPreview = () => {
    if (!formData.posterUrl) return null;

    const optimizedUrl = getOptimizedPosterUrl(formData.posterUrl);
    return (
      <div className="image-preview">
        <img src={optimizedUrl} alt="Movie poster preview" />
      </div>
    );
  };

  const renderFormField = (label, name, type = "text", options = null) => {
    if (type === "array") {
      return (
        <div className="form-group">
          <label className="form-label">{label} (comma-separated)</label>
          <input
            type="text"
            required
            value={formData[name].join(", ")}
            onChange={(e) => handleArrayInput(e, name)}
            className="form-input"
          />
        </div>
      );
    }

    if (type === "select" && options) {
      return (
        <div className="form-group">
          <label className="form-label">{label}</label>
          <select
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="form-select"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "textarea") {
      return (
        <div className="form-group">
          <label className="form-label">{label}</label>
          <textarea
            name={name}
            required
            value={formData[name]}
            onChange={handleChange}
            rows="4"
            className="form-textarea"
          />
        </div>
      );
    }

    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <input
          type={type}
          name={name}
          required
          value={formData[name]}
          onChange={handleChange}
          className="form-input"
        />
      </div>
    );
  };

  return (
    <div className="add-movie-container">
      <div className="card">
        <div className="card-body">
          <h2 className="page-title">Add New Movie</h2>

          {(error || submitError) && (
            <div className="error-message">{error || submitError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Basic movie details */}
              <div className="form-section">
                <h3>Basic Details</h3>
                {renderFormField("Title", "title")}
                {renderFormField("Duration (minutes)", "duration", "number")}
                <div className="form-group">
  <label className="form-label">Languages</label>
  <LanguageSelector
    selectedLanguages={formData.languages.map(lang => ({ code: lang.toLowerCase(), name: lang }))}
    onChange={(selected) => {
      const languages = selected.map(lang => lang.name);
      setFormData(prev => ({
        ...prev,
        languages
      }));
    }}
  />
</div>
                {renderFormField("Genres", "genres", "array")}
                {renderFormField("Experience", "experience", "array")}
              </div>

              {/* Cast section */}
              <div className="form-section">
                <h3>Cast Members</h3>
                <div className="actor-search">
                  <div className="search-input-container">
                    <Search size={20} />
                    <input
                      type="text"
                      value={actorSearch}
                      onChange={(e) => setActorSearch(e.target.value)}
                      placeholder="Search actors..."
                      className="form-input"
                    />
                    {searching && <Spinner size="sm" />}
                  </div>

                  {actorResults.length > 0 && (
                    <div className="actor-results">
                      {actorResults.map((actor) => (
                        <div
                          key={actor.id}
                          className="actor-result-item"
                          onClick={() => handleActorSelect(actor)}
                        >
                          <img
                            src={actor.imageUrl || DEFAULT_ACTOR_IMAGE}
                            alt={actor.name}
                          />
                          <span>{actor.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {actorSearch && !actorResults.length && !searching && (
                    <div className="no-results">
                      <p>No actors found</p>
                      <button
                        type="button"
                        className="btn-create-actor"
                        onClick={handleCreateNewActor}
                      >
                        <Plus size={16} /> Create "{actorSearch}"
                      </button>
                    </div>
                  )}
                </div>

                {/* Cast list */}
                <div className="cast-list">
                  {formData.cast.map((member, index) => (
                    <div key={index} className="cast-member">
                      <img src={member.imageUrl} alt={member.name} />
                      <div className="cast-member-details">
                        <input
                          type="text"
                          value={member.characterName}
                          onChange={(e) =>
                            updateCastMember(
                              index,
                              "characterName",
                              e.target.value
                            )
                          }
                          placeholder="Character name"
                          className="form-input"
                        />
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateCastMember(index, "role", e.target.value)
                          }
                          className="form-select"
                        >
                          <option value="LEAD">Lead</option>
                          <option value="SUPPORTING">Supporting</option>
                          <option value="CAMEO">Cameo</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeCastMember(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional details */}
              <div className="form-section">
                <h3>Additional Details</h3>
                {renderFormField("Grade", "grade")}
                {renderFormField("Release Date", "releaseDate", "date")}
                {renderFormField("Trailer URL", "trailerUrl", "url")}
                {renderFormField("Status", "status", "select", [
                  { value: "UPCOMING", label: "Upcoming" },
                  { value: "RELEASED", label: "Released" },
                ])}
                {renderFormField("Description", "description", "textarea")}
              </div>

              {/* Poster upload */}
              <div className="form-section">
                <h3>Movie Poster</h3>
                <div className="poster-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-upload"
                  />
                  {imageLoading && (
                    <p className="loading-text">Uploading image...</p>
                  )}
                  {formData.posterUrl && renderPosterPreview()}
                </div>
              </div>
            </div>

            <div className="button-container">
              <button
                type="button"
                onClick={() => navigate("/admin/movies")}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || imageLoading || updatingActors}
                className="btn btn-primary"
              >
                {loading || updatingActors ? "Creating..." : "Create Movie"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMovie;