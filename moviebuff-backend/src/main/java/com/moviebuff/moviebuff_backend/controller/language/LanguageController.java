package com.moviebuff.moviebuff_backend.controller.language;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moviebuff.moviebuff_backend.model.language.Language;
import com.moviebuff.moviebuff_backend.service.language.ILanguageService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/languages")
@CrossOrigin(origins = "*")
public class LanguageController {

    @Autowired
    private ILanguageService languageService;

    @GetMapping
    public ResponseEntity<List<Language>> getAllLanguages() {
        return ResponseEntity.ok(languageService.getAllLanguages());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Language> getLanguageById(@PathVariable String id) {
        return ResponseEntity.ok(languageService.getLanguageById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Language>> searchLanguages(@RequestParam String query) {
        return ResponseEntity.ok(languageService.searchLanguages(query));
    }

    @PostMapping
    public ResponseEntity<Language> createLanguage(@Valid @RequestBody Language language) {
        return ResponseEntity.ok(languageService.createLanguage(language));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Language> updateLanguage(@PathVariable String id, @Valid @RequestBody Language language) {
        return ResponseEntity.ok(languageService.updateLanguage(id, language));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLanguage(@PathVariable String id) {
        languageService.deleteLanguage(id);
        return ResponseEntity.noContent().build();
    }
}