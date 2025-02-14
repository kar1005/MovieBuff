// package com.moviebuff.moviebuff_backend.config;

// //comment
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// // import org.springframework.web.cors.CorsConfiguration;
// // import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
// // import org.springframework.web.filter.CorsFilter;
// import org.springframework.web.servlet.config.annotation.CorsRegistry;
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// @Configuration
// public class CorsConfig {
//     @Bean
//     public WebMvcConfigurer corsConfigurer() {
//         return new WebMvcConfigurer() {
//             @Override
//             public void addCorsMappings(CorsRegistry registry) {
//                 registry.addMapping("/**")
//                         .allowedOrigins("http://localhost:3000")  // Allow frontend
//                         .allowedMethods("GET", "POST", "PUT", "DELETE")
//                         .allowCredentials(true)
//                         .exposedHeaders("Authorization");
//             }
//         };
//     }
// }
// // @Configuration
// // public class CorsConfig {

// //     @Bean
// //     public CorsFilter corsFilter() {
// //         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
// //         CorsConfiguration config = new CorsConfiguration();

// //         // Add your frontend URL explicitly
// //         config.addAllowedOrigin("http://localhost:3000");
        
// //         // Allow credentials
// //         config.setAllowCredentials(true);
        
// //         // Allow all methods
// //         config.addAllowedMethod("*");
        
// //         // Allow specific headers
// //         config.addAllowedHeader("*");
        
// //         // Add exposed headers if needed
// //         config.addExposedHeader("Authorization");
        
// //         // Configure options for preflight requests
// //         config.setMaxAge(3600L);
        
// //         source.registerCorsConfiguration("/**", config);
// //         return new CorsFilter(source);
// //     }
// // }

