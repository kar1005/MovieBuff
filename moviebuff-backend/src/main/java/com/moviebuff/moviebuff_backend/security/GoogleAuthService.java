package com.moviebuff.moviebuff_backend.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.moviebuff.moviebuff_backend.model.user.User;
import com.moviebuff.moviebuff_backend.repository.interfaces.user.IUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class GoogleAuthService {
    @Value("${google.client.id}")
    private String googleClientId;

    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public GoogleAuthService(IUserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User verifyGoogleToken(String idTokenString) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
            new NetHttpTransport(), new GsonFactory())
            .setAudience(Collections.singletonList(googleClientId))
            .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken == null) {
            throw new Exception("Invalid Google ID token");
        }

        Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String username = (String) payload.get("name");
        String googleId = payload.getSubject(); // Use Google's unique ID

        // Try to find existing user by email or create new
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // Create new user if not exists
        User newUser = User.builder()
            .email(email)
            .username(username)
            .password(passwordEncoder.encode(googleId)) // Secure random password
            .role(User.UserRole.CUSTOMER)
            .build();

        return userRepository.save(newUser);
    }
}