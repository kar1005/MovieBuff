import React from 'react'
import HomePageSlider from './HomePageSlider';
import LatestMoviesCarousel from './LatestMoviesCarousel'

function Home() {
  return (
    <>
      <HomePageSlider />
      <div className="py-8">
        <LatestMoviesCarousel />
      </div>
    </>
  )
}

export default Home
