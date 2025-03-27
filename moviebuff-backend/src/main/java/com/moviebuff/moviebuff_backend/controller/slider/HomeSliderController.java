package com.moviebuff.moviebuff_backend.controller.slider;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moviebuff.moviebuff_backend.model.slider.HomeSlider;
import com.moviebuff.moviebuff_backend.repository.interfaces.slider.HomeSliderRepository;

@RestController
@RequestMapping("/api/slider")
public class HomeSliderController {

    @Autowired
    private HomeSliderRepository homeSliderRepository;

    @GetMapping
    public ResponseEntity<List<HomeSlider>> getAllSliders() {
        List<HomeSlider> sliders = homeSliderRepository.findAll();
        return new ResponseEntity<>(sliders, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<HomeSlider> getSliderById(@PathVariable String id) {
        Optional<HomeSlider> slider = homeSliderRepository.findById(id);
        return slider.map(ResponseEntity::ok)
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<HomeSlider> createSlider(@RequestBody HomeSlider slider) {
        System.out.println("Received slider data: " + slider); // Add logging
        HomeSlider createdSlider = homeSliderRepository.save(slider);
        return new ResponseEntity<>(createdSlider, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HomeSlider> updateSlider(@PathVariable String id, @RequestBody HomeSlider updatedSlider) {
        Optional<HomeSlider> existingSlider = homeSliderRepository.findById(id);
        if (existingSlider.isPresent()) {
            updatedSlider.setId(id); // Ensure ID remains the same
            HomeSlider savedSlider = homeSliderRepository.save(updatedSlider);
            return new ResponseEntity<>(savedSlider, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlider(@PathVariable String id) {
        homeSliderRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}