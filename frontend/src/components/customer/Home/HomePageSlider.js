import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './HomePageSlider.css';

const HomePageSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sliderImages, setSliderImages] = useState([]);
    const [isHovering, setIsHovering] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    axios.defaults.baseURL = 'http://localhost:8080';

    useEffect(() => {
        fetchSliderImages();
    }, []);

    useEffect(() => {
        // Auto-slide logic
        let intervalId;
        if (!isHovering && sliderImages.length > 0) {
            intervalId = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
            }, 5000); // Change slide every 5 seconds for better user experience
        }

        // Cleanup interval on component unmount or when hovering
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [sliderImages, isHovering]);

    const fetchSliderImages = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/slider');
            setSliderImages(response.data);
        } catch (error) {
            console.error('Failed to fetch slider images', error);
        } finally {
            setIsLoading(false);
        }
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => 
            prev === 0 ? sliderImages.length - 1 : prev - 1
        );
    };

    if (isLoading) {
        return (
            <div className="slider-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div 
            className="homePageSlider"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="slider-progress-bar">
                <div 
                    className="progress" 
                    style={{ 
                        width: `${((currentSlide + 1) / sliderImages.length) * 100}%`,
                        transition: isHovering ? 'none' : 'width 5s linear'
                    }}
                ></div>
            </div>
            
            {sliderImages.length > 0 && (
                <div className="slider-wrapper">
                    {sliderImages.map((image, index) => (
                        <div 
                            key={image.id} 
                            className={`slide ${index === currentSlide ? 'active' : ''}`}
                            style={{
                                opacity: index === currentSlide ? 1 : 0,
                                zIndex: index === currentSlide ? 1 : 0,
                                backgroundImage: `url(${image.imageUrl})`
                            }}
                        >
                            <div className="slide-overlay"></div>
                            {/* Removed content elements as requested */}
                        </div>
                    ))}
                </div>
            )}

            {/* Navigation Buttons */}
            <button 
                onClick={prevSlide} 
                className="slider-nav prev"
                aria-label="Previous slide"
            >
                <ChevronLeft size={24} />
            </button>

            <button 
                onClick={nextSlide} 
                className="slider-nav next"
                aria-label="Next slide"
            >
                <ChevronRight size={24} />
            </button>

            {/* Slide Indicators - Now centered */}
            <div className="slider-indicators">
                {sliderImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`indicator ${currentSlide === index ? 'active' : ''}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomePageSlider;