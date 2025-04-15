package com.moviebuff.moviebuff_backend.service.language;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.language.Language;
import com.moviebuff.moviebuff_backend.repository.interfaces.language.ILanguageRepository;

@Service
public class LanguageServiceImpl implements ILanguageService {

    @Autowired
    private ILanguageRepository languageRepository;
    
    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * Get all languages
     */
    @Override
    @Cacheable(value = "languages")
    public List<Language> getAllLanguages() {
        return languageRepository.findAll();
    }

    /**
     * Get language by ID
     */
    @Override
    @Cacheable(value = "languages", key = "#id")
    public Language getLanguageById(String id) {
        return languageRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Language not found with id: " + id));
    }

    /**
     * Get language by code
     */
    @Override
    @Cacheable(value = "languages", key = "'code:' + #code")
    public Language getLanguageByCode(String code) {
        return languageRepository.findByCode(code)
            .orElseThrow(() -> new ResourceNotFoundException("Language not found with code: " + code));
    }

    /**
     * Search languages by query
     */
    @Override
    public List<Language> searchLanguages(String query) {
        return languageRepository.findByNameContainingIgnoreCase(query);
    }

    /**
     * Create a new language
     */
    @Override
    @CacheEvict(value = "languages", allEntries = true)
    public Language createLanguage(Language language) {
        // Set initial usage count if not set
        if (language.getUsageCount() == null) {
            language.setUsageCount(0);
        }
        
        // Set custom flag if not set
        if (language.getIsCustom() == null) {
            language.setIsCustom(true);
        }
        
        // Check if language with this code already exists
        Optional<Language> existingLang = languageRepository.findByCode(language.getCode());
        if (existingLang.isPresent()) {
            return existingLang.get();
        }
        
        return languageRepository.save(language);
    }

    /**
     * Update an existing language
     */
    @Override
    @CacheEvict(value = "languages", key = "#id")
    public Language updateLanguage(String id, Language language) {
        Language existingLanguage = getLanguageById(id);
        
        existingLanguage.setName(language.getName());
        existingLanguage.setNativeName(language.getNativeName());
        
        // Don't update code as it's the unique identifier
        // Don't update isCustom flag
        
        return languageRepository.save(existingLanguage);
    }

    /**
     * Delete a language
     */
    @Override
    @CacheEvict(value = "languages", allEntries = true)
    public void deleteLanguage(String id) {
        // Can only delete custom languages
        Language language = getLanguageById(id);
        if (language.getIsCustom() != null && language.getIsCustom()) {
            languageRepository.deleteById(id);
        }
    }

    /**
     * Increment usage count
     */
    @Override
    @CacheEvict(value = "languages", key = "#languageId")
    public void incrementUsageCount(String languageId) {
        Query query = new Query(Criteria.where("id").is(languageId));
        Update update = new Update().inc("usageCount", 1);
        mongoTemplate.updateFirst(query, update, Language.class);
    }
}
