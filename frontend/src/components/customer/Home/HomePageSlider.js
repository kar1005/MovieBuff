import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './HomePageSlider.css';

const HomePageSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sliderImages, setSliderImages] = useState([]);
    const [isHovering, setIsHovering] = useState(false);

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
            }, 2000); // Change slide every 2 seconds
        }

        // Cleanup interval on component unmount or when hovering
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [sliderImages, isHovering]);

    const fetchSliderImages = async () => {
        try {
            const response = await axios.get('/api/slider');
            setSliderImages(response.data);
        } catch (error) {
            console.error('Failed to fetch slider images', error);
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

    return (
        <div 
            className="homePageSlider"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {sliderImages.length > 0 && (
                <div 
                    className="slider-container"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {sliderImages.map((image, index) => (
                        <div key={image.id} className="slide">
                            <img src={image.imageUrl} alt={`Slide ${index + 1}`} />
                        </div>
                    ))}
                </div>
            )}

            {/* Previous Button */}
            <button 
                onClick={prevSlide} 
                className="prev navigation-button"
            >
                <ChevronLeft className="nav-icon" />
            </button>

            {/* Next Button */}
            <button 
                onClick={nextSlide} 
                className="next navigation-button"
            >
                <ChevronRight className="nav-icon" />
            </button>

            {/* Slide Indicators */}
            <div className="indicators">
                {sliderImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`indicator ${currentSlide === index ? 'active' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomePageSlider;