package com.moviebuff.moviebuff_backend.repository.interfaces.language;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.moviebuff.moviebuff_backend.model.language.Language;

@Repository
public interface ILanguageRepository extends MongoRepository<Language, String> {
    Optional<Language> findByCode(String code);
    List<Language> findByNameContainingIgnoreCase(String query);
    List<Language> findByIsCustom(Boolean isCustom);
}