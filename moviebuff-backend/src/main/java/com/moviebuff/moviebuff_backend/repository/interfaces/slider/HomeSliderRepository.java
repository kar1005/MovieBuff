package com.moviebuff.moviebuff_backend.repository.interfaces.slider;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.moviebuff.moviebuff_backend.model.slider.HomeSlider;

@Repository
public interface HomeSliderRepository extends MongoRepository<HomeSlider, String> {
}