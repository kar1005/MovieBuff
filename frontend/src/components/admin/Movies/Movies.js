import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

function Movies({ handleClick }) {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMovieData();
    }, []);

    const fetchMovieData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:8080/api/movies', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMovies(data);
        } catch (err) {
            console.error('Error fetching movies:', err);
            setError('Failed to load movies. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="movies-container">
            <div className="movies-header">
                <h2>Movies</h2>
                <button 
                    className="btn btn-primary"  // Changed from add-movie-btn to btn btn-primary
                    onClick={() => handleClick('addmovie')}
                    style={{ marginLeft: 'auto' }}  // This will push the button to the right
                >
                    + Add Movie
                </button>
            </div>
            
            {movies.length === 0 ? (
                <div className="no-movies">
                    No movies available. Add some movies to get started.
                </div>
            ) : (
                <table className="table">
                    <thead className="thead-dark">
                        <tr>
                            <th scope="col">Title</th>
                            <th scope="col">Languages</th>
                            <th scope="col">Cast</th>
                            <th scope="col">Poster</th>
                            <th scope="col">Duration(minutes)</th>
                            <th scope='col'>Release Date</th>
                            <th scope='col'>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movies.map((movie) => (
                            <tr key={movie.id}>
                                <td>{movie.title}</td>
                                <td>{Array.isArray(movie.languages) ? movie.languages.join(', ') : movie.languages}</td>
                                <td>{Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast}</td>
                                <td>
                                    {movie.posterUrl && (
                                        <img 
                                            src={movie.posterUrl}
                                            alt={`${movie.title} poster`}
                                            style={{
                                                width: '100px',
                                                height: '150px',
                                                objectFit: 'cover',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    )}
                                </td>
                                <td>{movie.duration}</td>
                                <td>{movie.releaseDate}</td>
                                <td>{movie.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Movies;