package com.moviebuff.moviebuff_backend.config;

import java.util.Arrays;
import java.util.List;
// import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.moviebuff.moviebuff_backend.model.language.Language;
import com.moviebuff.moviebuff_backend.repository.interfaces.language.ILanguageRepository;

@Configuration
public class LanguageDataInitializer {

    @Autowired
    private ILanguageRepository languageRepository;
    
    @Bean
    CommandLineRunner initLanguageData() {
        return args -> {
            // Only initialize if the languages collection is empty
            if (languageRepository.count() == 0) {
                // List of common Indian languages + major international languages
                List<Language> languages = Arrays.asList(
                    createLanguage("en", "English", "English", false, 0),
                    createLanguage("hi", "Hindi", "हिन्दी", false, 0),
                    createLanguage("ta", "Tamil", "தமிழ்", false, 0),
                    createLanguage("te", "Telugu", "తెలుగు", false, 0),
                    createLanguage("ml", "Malayalam", "മലയാളം", false, 0),
                    createLanguage("kn", "Kannada", "ಕನ್ನಡ", false, 0),
                    createLanguage("bn", "Bengali", "বাংলা", false, 0),
                    createLanguage("mr", "Marathi", "मराठी", false, 0),
                    createLanguage("gu", "Gujarati", "ગુજરાતી", false, 0),
                    createLanguage("pa", "Punjabi", "ਪੰਜਾਬੀ", false, 0),
                    createLanguage("ur", "Urdu", "اردو", false, 0),
                    createLanguage("or", "Odia", "ଓଡ଼ିଆ", false, 0),
                    createLanguage("as", "Assamese", "অসমীয়া", false, 0),
                    createLanguage("es", "Spanish", "Español", false, 0),
                    createLanguage("fr", "French", "Français", false, 0),
                    createLanguage("de", "German", "Deutsch", false, 0),
                    createLanguage("it", "Italian", "Italiano", false, 0),
                    createLanguage("pt", "Portuguese", "Português", false, 0),
                    createLanguage("ru", "Russian", "Русский", false, 0),
                    createLanguage("ja", "Japanese", "日本語", false, 0),
                    createLanguage("zh", "Chinese", "中文", false, 0),
                    createLanguage("ar", "Arabic", "العربية", false, 0),
                    createLanguage("ko", "Korean", "한국어", false, 0)
                );
                
                // Save all languages in one batch operation
                languageRepository.saveAll(languages);
            }
        };
    }
    
    private Language createLanguage(String code, String name, String nativeName, Boolean isCustom, Integer usageCount) {
        Language language = new Language();
        language.setCode(code);
        language.setName(name);
        language.setNativeName(nativeName);
        language.setIsCustom(isCustom);
        language.setUsageCount(usageCount);
        return language;
    }
}