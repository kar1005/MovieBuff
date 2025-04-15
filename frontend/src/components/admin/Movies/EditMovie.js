import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Spinner, Modal, Button } from "react-bootstrap";
import { Search, Plus, X, Trash2 } from "lucide-react";
import {
  updateMovie,
  deleteMovie,
  fetchMovieById,
  selectMovies,
} from "../../../redux/slices/adminSlice";
import LanguageSelector from "../common/LanguageSelector";

import actorService from "../../../services/actorService";
import "./EditMovie.css";
import cloudinaryService from "../../../services/cloudinaryService";

const EditMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    currentMovie,
    loading,
    error: submitError,
  } = useSelector(selectMovies);

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [oldPosterUrl, setOldPosterUrl] = useState("");
  const [originalCast, setOriginalCast] = useState([]);
  const [updatingActors, setUpdatingActors] = useState(false);

  // Load movie data
  useEffect(() => {
    dispatch(fetchMovieById(id));
  }, [dispatch, id]);

  // Set form data when movie is loaded
  useEffect(() => {
    if (currentMovie) {
      setFormData({
        ...currentMovie,
        releaseDate: currentMovie.releaseDate?.split("T")[0], // Format date for input
        languages: Array.isArray(currentMovie.languages)
          ? currentMovie.languages
          : [],
        genres: Array.isArray(currentMovie.genres) ? currentMovie.genres : [],
        experience: Array.isArray(currentMovie.experience)
          ? currentMovie.experience
          : [],
        cast: Array.isArray(currentMovie.cast) ? currentMovie.cast : [],
      });
      setOldPosterUrl(currentMovie.posterUrl);
      
      // Save original cast for later comparison
      setOriginalCast(Array.isArray(currentMovie.cast) ? [...currentMovie.cast] : []);
    }
  }, [currentMovie]);

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

  const extractPublicId = (url) => {
    if (!url) return null;
    const splitUrl = url.split("/");
    const filename = splitUrl[splitUrl.length - 1];
    return `movie-posters/${filename.split(".")[0]}`;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    try {
      // Upload new image
      const result = await cloudinaryService.uploadImage(file, "movie-posters");

      // If there's an existing poster, delete it
      if (oldPosterUrl) {
        const oldPublicId = extractPublicId(oldPosterUrl);
        if (oldPublicId) {
          await cloudinaryService.deleteImage(oldPublicId);
        }
      }

      setFormData((prev) => ({
        ...prev,
        posterUrl: result.url,
      }));
      setOldPosterUrl(result.url);
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setImageLoading(false);
    }
  };

  // Add this function inside the EditMovie component before the return statement
  const renderFormField = (label, name, type = "text", options = null) => {
    if (type === "array") {
      return (
        <div className="form-group">
          <label className="form-label">{label} (comma-separated)</label>
          <input
            type="text"
            value={formData[name].join(", ")}
            onChange={(e) => handleArrayInput(e, name)}
            className="form-input"
            required
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
            value={formData[name]}
            onChange={handleChange}
            rows="4"
            className="form-textarea"
            required
          />
        </div>
      );
    }

    if (type === "date") {
      return (
        <div className="form-group">
          <label className="form-label">{label}</label>
          <input
            type="date"
            name={name}
            value={formData[name]?.split("T")[0] || ""} // Handle date format
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
      );
    }

    if (type === "number") {
      return (
        <div className="form-group">
          <label className="form-label">{label}</label>
          <input
            type="number"
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="form-input"
            required
            min="0"
          />
        </div>
      );
    }

    // Default text input
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
    );
  };

  const handleActorSelect = async (actor) => {
    const existingActor = formData.cast.find(
      (cast) => cast.actorId === actor.id
    );
    if (existingActor) {
      setError("This actor is already in the cast");
      return;
    }

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

  // Update actors' filmography based on cast changes
  const updateActorsFilmography = async (updatedMovie) => {
    try {
      setUpdatingActors(true);
      
      // Find added actors (in current cast but not in original)
      const addedActors = formData.cast.filter(
        newCast => !originalCast.some(origCast => origCast.actorId === newCast.actorId)
      );
      
      // Find removed actors (in original cast but not in current)
      const removedActors = originalCast.filter(
        origCast => !formData.cast.some(newCast => newCast.actorId === origCast.actorId)
      );

      // Process added actors - add movie to their filmography
      for (const actor of addedActors) {
        try {
          // Get current actor data
          const actorData = await actorService.getActorById(actor.actorId);
          
          // Create movie appearance object
          const movieAppearance = {
            movieId: updatedMovie.id,
            movieTitle: updatedMovie.title,
            characterName: actor.characterName,
            role: actor.role,
            releaseDate: updatedMovie.releaseDate ? new Date(updatedMovie.releaseDate).toISOString() : null,
            movieRating: updatedMovie.rating?.average || 0
          };
          
          // Prepare updated filmography
          const currentFilmography = actorData.filmography || [];
          const updatedFilmography = [...currentFilmography, movieAppearance];
          
          // Update the actor's filmography
          await actorService.updateFilmography(actor.actorId, updatedFilmography);
          
          console.log(`Added movie to ${actor.name}'s filmography`);
        } catch (error) {
          console.error(`Error adding movie to actor ${actor.name}'s filmography:`, error);
        }
      }
      
      // Process removed actors - remove movie from their filmography
      for (const actor of removedActors) {
        try {
          // Get current actor data
          const actorData = await actorService.getActorById(actor.actorId);
          
          // Filter out this movie from filmography
          const currentFilmography = actorData.filmography || [];
          const updatedFilmography = currentFilmography.filter(
            film => film.movieId !== updatedMovie.id
          );
          
          // Update the actor's filmography
          await actorService.updateFilmography(actor.actorId, updatedFilmography);
          
          console.log(`Removed movie from ${actor.name}'s filmography`);
        } catch (error) {
          console.error(`Error removing movie from actor ${actor.name}'s filmography:`, error);
        }
      }
      
      // Update filmography for actors who remained but possibly changed roles or character names
      const remainingActors = formData.cast.filter(
        newCast => originalCast.some(origCast => origCast.actorId === newCast.actorId)
      );
      
      for (const actor of remainingActors) {
        try {
          // Get current actor data
          const actorData = await actorService.getActorById(actor.actorId);
          
          // Find existing filmography
          const currentFilmography = actorData.filmography || [];
          
          // Find and update this movie in the filmography
          const updatedFilmography = currentFilmography.map(film => {
            if (film.movieId === updatedMovie.id) {
              return {
                ...film,
                movieTitle: updatedMovie.title, // In case title changed
                characterName: actor.characterName,
                role: actor.role,
                releaseDate: updatedMovie.releaseDate ? new Date(updatedMovie.releaseDate).toISOString() : film.releaseDate,
                movieRating: updatedMovie.rating?.average || film.movieRating || 0
              };
            }
            return film;
          });
          
          // Update the actor's filmography
          await actorService.updateFilmography(actor.actorId, updatedFilmography);
          
          console.log(`Updated ${actor.name}'s role in filmography`);
        } catch (error) {
          console.error(`Error updating actor ${actor.name}'s filmography:`, error);
        }
      }
    } catch (error) {
      console.error("Error updating actors' filmography:", error);
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
      // First update the movie
      const updatedMovie = await dispatch(updateMovie({ id, data: formData })).unwrap();
      
      // Then update actors' filmography based on cast changes
      await updateActorsFilmography(updatedMovie);
      
      navigate("/admin/movies");
    } catch (err) {
      setError(err.message || "Failed to update movie");
    }
  };

  const handleDelete = async () => {
    try {
      // Before deleting the movie, update all cast actors' filmography to remove this movie
      for (const actor of originalCast) {
        try {
          // Get current actor data
          const actorData = await actorService.getActorById(actor.actorId);
          
          // Filter out this movie from filmography
          const currentFilmography = actorData.filmography || [];
          const updatedFilmography = currentFilmography.filter(
            film => film.movieId !== id
          );
          
          // Update the actor's filmography
          await actorService.updateFilmography(actor.actorId, updatedFilmography);
        } catch (error) {
          console.error(`Error removing movie from actor ${actor.name}'s filmography during deletion:`, error);
        }
      }

      // Delete the poster image from Cloudinary if it exists
      if (oldPosterUrl) {
        const publicId = extractPublicId(oldPosterUrl);
        if (publicId) {
          await cloudinaryService.deleteImage(publicId);
        }
      }

      // Delete the movie from the database
      await dispatch(deleteMovie(id)).unwrap();
      navigate("/admin/movies");
    } catch (err) {
      setError(err.message || "Failed to delete movie");
    }
    setShowDeleteModal(false);
  };

  if (loading && !formData) {
    return (
      <div className="loading-container">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const getOptimizedPosterUrl = (url) => {
    return cloudinaryService.getOptimizedUrl(url, {
      width: 300,
      height: 450,
      quality: "auto",
    });
  };

  const renderPosterPreview = () => {
    if (!formData.posterUrl) return null;

    const optimizedUrl = getOptimizedPosterUrl(formData.posterUrl);
    return (
      <div className="current-poster">
        <h4>Current Poster</h4>
        <div className="image-preview">
          <img src={optimizedUrl} alt="Current movie poster" />
        </div>
      </div>
    );
  };

  return (
    <div className="edit-movie-container">
      <div className="card">
        <div className="card-body">
          <div className="page-header">
            <h2 className="page-title">Edit Movie - {formData.title}</h2>
            <button
              className="btn btn-danger delete-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={18} />
              Delete Movie
            </button>
          </div>

          {(error || submitError) && (
            <div className="error-message">{error || submitError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Basic movie details */}
              <div className="form-section">
                <h3>Basic Details</h3>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
  <label>Languages</label>
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

                <div className="form-group">
                  <label>Genres (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.genres.join(", ")}
                    onChange={(e) => handleArrayInput(e, "genres")}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Experience (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.experience.join(", ")}
                    onChange={(e) => handleArrayInput(e, "experience")}
                    className="form-input"
                  />
                </div>
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

                <div className="cast-list">
                  {formData.cast.map((member, index) => (
                    <div key={index} className="cast-member">
                      <img
                        src={member.imageUrl || DEFAULT_ACTOR_IMAGE}
                        alt={member.name}
                      />
                      <div className="cast-member-details">
                        <span className="actor-name">{member.name}</span>
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
                <div className="form-group">
                  <label>Grade</label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Release Date</label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Trailer URL</label>
                  <input
                    type="url"
                    name="trailerUrl"
                    value={formData.trailerUrl}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="RELEASED">Released</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="form-textarea"
                    required
                  />
                </div>
              </div>

              {/* Poster section */}
              <div className="form-section">
                <h3>Movie Poster</h3>
                <div className="poster-upload">
                  {formData.posterUrl && renderPosterPreview()}
                  <div className="new-poster-upload">
                    <h4>Upload New Poster</h4>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-upload"
                    />
                    {imageLoading && (
                      <div className="upload-loading">
                        <Spinner animation="border" size="sm" />
                        <span>Uploading image...</span>
                      </div>
                    )}
                  </div>
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
                className={`btn btn-primary ${(loading || updatingActors) ? "loading" : ""}`}
              >
                {loading || updatingActors ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className="delete-confirmation-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="delete-warning">
            <Trash2 size={24} className="warning-icon" />
            <p>Are you sure you want to delete "{formData.title}"?</p>
            <p className="text-danger">
              This action cannot be undone. The movie and its poster will be
              permanently deleted.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading || updatingActors}>
            {loading || updatingActors ? "Deleting..." : "Delete Movie"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EditMovie;