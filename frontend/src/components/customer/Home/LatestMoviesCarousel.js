import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Clock } from 'lucide-react';

const LatestMoviesCarousel = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  
  // Calculate how many movies to show based on screen width
  const [itemsToShow, setItemsToShow] = useState(3);

  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsToShow(1);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(2);
      } else {
        setItemsToShow(3);
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/movies/latest-released?limit=5');
        if (!response.ok) {
          throw new Error('Failed to fetch movies');
        }
        const data = await response.json();
        setMovies(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchMovies();
  }, []);
  
  const nextSlide = () => {
    setCurrentIndex(prevIndex => 
      prevIndex + itemsToShow >= movies.length ? 0 : prevIndex + 1
    );
  };
  
  const prevSlide = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? Math.max(0, movies.length - itemsToShow) : prevIndex - 1
    );
  };
  
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center p-12">
        <div className="text-xl">Loading latest movies...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full flex justify-center items-center p-12">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }
  
  // Check if we should show navigation buttons
  const showNavigation = movies.length > itemsToShow;
  
  return (
    <div className="w-full py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Latest Releases</h2>
        <div className="relative">
          <div 
            className="flex overflow-hidden"
            ref={carouselRef}
          >
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
            >
              {movies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="flex-none w-full sm:w-1/2 lg:w-1/3 px-2"
                  style={{ width: `${100 / itemsToShow}%` }}
                >
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
                    <div className="relative pb-2/3">
                      <img 
                        src={movie.posterUrl || '/api/placeholder/300/450'} 
                        alt={movie.title}
                        className="absolute h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{movie.title}</h3>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm">
                          {movie.rating?.average ? `${movie.rating.average.toFixed(1)}/10` : 'N/A'}
                          {movie.rating?.count ? ` (${movie.rating.count})` : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap mt-2">
                        {movie.genres?.slice(0, 2).map((genre, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 rounded-full px-2 py-1 mr-1 mb-1">
                            {genre}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {movie.duration ? formatDuration(movie.duration) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {showNavigation && (
            <>
              <button 
                onClick={prevSlide}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-lg"
                aria-label="Previous movies"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-lg"
                aria-label="Next movies"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestMoviesCarousel;