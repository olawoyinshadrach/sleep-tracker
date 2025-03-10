import React, { useState, useEffect } from 'react';
import './SimpleCarousel.css';

const SimpleCarousel = ({ children, autoplayInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const childrenArray = React.Children.toArray(children);
  
  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
    }, autoplayInterval);
    
    return () => clearInterval(timer);
  }, [childrenArray.length, autoplayInterval]);
  
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? childrenArray.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % childrenArray.length
    );
  };
  
  return (
    <div className="simple-carousel">
      <div className="carousel-container">
        {childrenArray.map((child, index) => (
          <div 
            key={index} 
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
          >
            {child}
          </div>
        ))}
      </div>
      
      <div className="carousel-controls">
        <button className="carousel-btn prev" onClick={goToPrevious} aria-label="Previous slide">
          &lt;
        </button>
        <div className="carousel-dots">
          {childrenArray.map((_, index) => (
            <button 
              key={index} 
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <button className="carousel-btn next" onClick={goToNext} aria-label="Next slide">
          &gt;
        </button>
      </div>
    </div>
  );
};

export default SimpleCarousel;
