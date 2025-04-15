// src/main/java/com/moviebuff/controller/user/UserController.java
package com.moviebuff.moviebuff_backend.controller.user;

import com.moviebuff.moviebuff_backend.dto.response.TheaterResponse;
import com.moviebuff.moviebuff_backend.exception.ResourceNotFoundException;
import com.moviebuff.moviebuff_backend.model.user.User;
import com.moviebuff.moviebuff_backend.repository.interfaces.user.IUserRepository;
// import com.moviebuff.moviebuff_backend.service.Email.EmailService;
import com.moviebuff.moviebuff_backend.service.theater.ITheaterService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private ITheaterService theaterService;
    @Autowired
    private IUserRepository userRepository;

    // @Autowired
    // private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/customer")
    public ResponseEntity<List<User>> getCustomers() {
        List<User> users = userRepository.findByRole(User.UserRole.CUSTOMER);
        System.out.println(users);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/theatremanager")
    public ResponseEntity<List<User>> getTheaterManagers() {
        List<User> theaterManagers = userRepository.findByRole(User.UserRole.THEATER_MANAGER);
        return ResponseEntity.ok(theaterManagers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        // Hash the password
        String rawPassword = user.getPassword(); // Get raw password before hashing
        user.setPassword(passwordEncoder.encode(rawPassword));
        
        User savedUser = userRepository.save(user);
        
        return ResponseEntity.ok(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User userRequest) {
        // Check if the user exists
        return userRepository.findById(id)
                .map(existingUser -> {
                    // Selectively update fields that are present in the request
                    if (userRequest.getUsername() != null) {
                        existingUser.setUsername(userRequest.getUsername());
                    }
                    if (userRequest.getEmail() != null) {
                        existingUser.setEmail(userRequest.getEmail());
                    }
                    if (userRequest.getPhoneNumber() != null) {
                        existingUser.setPhoneNumber(userRequest.getPhoneNumber());
                    }
                    
                    // Handle password separately for security
                    if (userRequest.getPassword() != null && !userRequest.getPassword().isEmpty()) {
                        existingUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
                    }
                    
                    // Update address if provided
                    if (userRequest.getAddress() != null) {
                        // If address is provided, update each field selectively
                        if (existingUser.getAddress() == null) {
                            existingUser.setAddress(new User.Address());
                        }
                        
                        if (userRequest.getAddress().getStreet() != null) {
                            existingUser.getAddress().setStreet(userRequest.getAddress().getStreet());
                        }
                        if (userRequest.getAddress().getCity() != null) {
                            existingUser.getAddress().setCity(userRequest.getAddress().getCity());
                        }
                        if (userRequest.getAddress().getState() != null) {
                            existingUser.getAddress().setState(userRequest.getAddress().getState());
                        }
                        if (userRequest.getAddress().getZipCode() != null) {
                            existingUser.getAddress().setZipCode(userRequest.getAddress().getZipCode());
                        }
                        if (userRequest.getAddress().getCoordinates() != null) {
                            existingUser.getAddress().setCoordinates(userRequest.getAddress().getCoordinates());
                        }
                    }
                    
                    // Update preferences if provided
                    if (userRequest.getPreferences() != null) {
                        // If preferences are provided, update each field selectively
                        if (existingUser.getPreferences() == null) {
                            existingUser.setPreferences(new User.UserPreferences());
                        }
                        
                        if (userRequest.getPreferences().getFavoriteGenres() != null) {
                            existingUser.getPreferences().setFavoriteGenres(userRequest.getPreferences().getFavoriteGenres());
                        }
                        if (userRequest.getPreferences().getPreferredLanguages() != null) {
                            existingUser.getPreferences().setPreferredLanguages(userRequest.getPreferences().getPreferredLanguages());
                        }
                        if (userRequest.getPreferences().getPreferredTheaters() != null) {
                            existingUser.getPreferences().setPreferredTheaters(userRequest.getPreferences().getPreferredTheaters());
                        }
                    }
                    
                    // Update role only if specified and current user is an admin (you might want to add role-based security here)
                    if (userRequest.getRole() != null) {
                        existingUser.setRole(userRequest.getRole());
                    }
                    
                    // Save the updated user
                    User updatedUser = userRepository.save(existingUser);
                    return ResponseEntity.ok(updatedUser);
                })
                .orElse(ResponseEntity.notFound().build());
    }


@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteUser(@PathVariable String id) {
    // First check if user exists
    User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    
    // If the user is a theater manager, delete their theaters first
    if (user.getRole() == User.UserRole.THEATER_MANAGER) {
        // Inject theaterService in the controller class
        List<TheaterResponse> theaters = theaterService.getTheatersByManagerId(id);
        for (TheaterResponse theater : theaters) {
            theaterService.deleteTheater(theater.getId());
        }
    }
    
    // Then delete the user
    userRepository.deleteById(id);
    return ResponseEntity.ok().build();
}

    @GetMapping("/search")
    public ResponseEntity<User> searchUserByUsername(@RequestParam String username) {
        return userRepository.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
