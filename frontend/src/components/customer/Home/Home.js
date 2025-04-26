import React from 'react'
import HomePageSlider from './HomePageSlider';
import LatestMoviesCarousel from './LatestMovieCarousel/LatestMoviesCarousel'
import UpcomingMoviesCarousel from './UpcomingMoviesCarousel/UpcomingMoviesCarousel';

function Home() {
  return (
    <>
      <HomePageSlider />
      <div className="py-8">
        <LatestMoviesCarousel />
        <UpcomingMoviesCarousel/>
      </div>
    </>
  )
}

export default Home
