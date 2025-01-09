package com.moviebuff.moviebuff_backend.controller.show;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moviebuff.moviebuff_backend.model.show.Show;
import com.moviebuff.moviebuff_backend.repository.interfaces.show.IShowRepository;

@RestController
@RequestMapping("api/shows")
public class ShowController {
    @Autowired
    private IShowRepository showRepository;

    @GetMapping
    public ResponseEntity<List<Show>> getAllShows(){
        List<Show> shows = showRepository.findAll();
        return ResponseEntity.ok(shows);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Show> getShowById(@PathVariable String id){
        return showRepository.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Show> createShow(@RequestBody Show show){
        Show saved = showRepository.save(show);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Show> updateShow(@PathVariable String id, @RequestBody Show show){
        if(!showRepository.existsById(id)){
            return ResponseEntity.notFound().build();
        }
        show.setId(id);
        Show updated = showRepository.save(show);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShow(@PathVariable String id){
        showRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
