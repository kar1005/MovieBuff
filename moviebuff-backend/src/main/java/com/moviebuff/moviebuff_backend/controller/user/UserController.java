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
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User user) {
        // Check if the user exists
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Get the existing user to preserve data not in request
        User existingUser = userRepository.findById(id).orElse(null);
        if (existingUser == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Set the ID to ensure we're updating the right record
        user.setId(id);
        
        // Only update password if provided in request
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            // Preserve existing password if not provided
            user.setPassword(existingUser.getPassword());
        }
        
        // Ensure role is preserved if not provided
        if (user.getRole() == null) {
            user.setRole(existingUser.getRole());
        }
        
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
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
