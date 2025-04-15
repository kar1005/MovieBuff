package com.moviebuff.moviebuff_backend.service.language;

import java.util.List;

import com.moviebuff.moviebuff_backend.model.language.Language;

public interface ILanguageService {
    List<Language> getAllLanguages();
    Language getLanguageById(String id);
    Language getLanguageByCode(String code);
    List<Language> searchLanguages(String query);
    Language createLanguage(Language language);
    Language updateLanguage(String id, Language language);
    void deleteLanguage(String id);
    void incrementUsageCount(String languageId);
}