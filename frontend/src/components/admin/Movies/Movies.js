import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';
import { Plus, Search } from 'lucide-react';
import { fetchMovies, selectMovies, setCurrentMovie } from '../../../redux/slices/adminSlice';
import './Movies.css';

function Movies() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { data: movies, loading, error } = useSelector(selectMovies);
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(fetchMovies());
    }, [dispatch]);

    useEffect(() => {
        handleSearch(searchTerm);
    }, [searchTerm, movies]);

    const handleSearch = (value) => {
        const searchValue = value.toLowerCase();
        const filtered = movies.filter(movie => 
            movie.title?.toLowerCase().includes(searchValue) ||
            movie.languages?.some(lang => lang.toLowerCase().includes(searchValue)) ||
            movie.cast?.some(actor => actor.name.toLowerCase().includes(searchValue))
        );
        setFilteredMovies(filtered);
    };

    const handleClick = (action, movieId = null) => {
        switch (action) {
            case 'addmovie':
                navigate('/admin/movies/add');
                break;
            case 'editmovie':
                // Find the movie and set it in the state before navigating
                const movieToEdit = movies.find(movie => movie.id === movieId);
                if (movieToEdit) {
                    dispatch(setCurrentMovie(movieToEdit));
                    navigate(`/admin/movies/edit/${movieId}`);
                }
                break;
            default:
                break;
        }
    };

    const renderCast = (cast) => {
        if (!cast || cast.length === 0) return 'No cast information';
        return cast.map(actor => actor.name).join(', ');
    };

    const renderStatus = (status) => {
        const statusColors = {
            UPCOMING: 'upcoming',
            NOW_SHOWING: 'now-showing',
            ENDED: 'ended'
        };
        return (
            <span className={`status-badge ${statusColors[status] || ''}`}>
                {status?.replace('_', ' ')}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                {error}
            </div>
        );
    }

    return (
        <div className="movies-container">
            <div className="movies-header">
                <h1>Movies</h1>
                <div className="header-actions">
                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search movies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button 
                        className="add-movie-btn"
                        onClick={() => handleClick('addmovie')}
                    >
                        <Plus size={20} />
                        Add Movie
                    </button>
                </div>
            </div>

            <div className="movies-table-container">
                <table className="movies-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Poster</th>
                            <th>Languages</th>
                            <th>Cast</th>
                            <th>Duration</th>
                            <th>Release Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMovies.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-results">
                                    No movies found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredMovies.map((movie) => (
                                <tr key={movie.id}>
                                    <td>{movie.title}</td>
                                    <td className="poster-cell">
                                        {movie.posterUrl && (
                                            <img 
                                                src={movie.posterUrl}
                                                alt={`${movie.title} poster`}
                                                className="movie-poster"
                                            />
                                        )}
                                    </td>
                                    <td>{movie.languages?.join(', ')}</td>
                                    <td>{renderCast(movie.cast)}</td>
                                    <td>{movie.duration} mins</td>
                                    <td>{new Date(movie.releaseDate).toLocaleDateString()}</td>
                                    <td>{renderStatus(movie.status)}</td>
                                    <td>
                                        <button 
                                            className="edit-btn"
                                            onClick={() => handleClick('editmovie', movie.id)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Movies;