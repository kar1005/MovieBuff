// src/main/java/com/moviebuff/model/user/User.java
package com.moviebuff.moviebuff_backend.model.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String username;
    private String email;
    private String password;
    private UserRole role;
    private String phoneNumber;
    private Address address;
    private UserPreferences preferences;

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private double[] coordinates;
    }

    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserPreferences {
        private List<String> favoriteGenres;
        private List<String> preferredLanguages;
        private List<String> preferredTheaters;
    }

    public enum UserRole {
        CUSTOMER,
        THEATER_MANAGER,
        ADMIN
    }
}