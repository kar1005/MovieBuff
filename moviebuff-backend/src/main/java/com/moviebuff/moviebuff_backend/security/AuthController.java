package com.moviebuff.moviebuff_backend.security;

import com.moviebuff.moviebuff_backend.model.user.User;
import com.moviebuff.moviebuff_backend.payload.response.JwtResponse;
import com.moviebuff.moviebuff_backend.payload.response.LoginRequest;

import java.util.Collections;
// import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.moviebuff.moviebuff_backend.repository.interfaces.user.IUserRepository;
import com.moviebuff.moviebuff_backend.service.Email.EmailService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000", 
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE},
    allowCredentials = "true")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private IUserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    private final GoogleAuthService googleAuthService;

    public AuthController(GoogleAuthService googleAuthService) {
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody GoogleAuthRequest request) {
        try {
            if (request.getIdToken() == null) {
                return ResponseEntity.badRequest().body("No ID token provided");
            }
            
            User user = googleAuthService.verifyGoogleToken(request.getIdToken());
            
            // Create authentication token
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                UserDetailsImpl.build(user),
                null,
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
            );
            
            String jwt = tokenProvider.generateToken(authentication);
            
            return ResponseEntity.ok(new JwtResponse(jwt, user));
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                .body("Error processing Google authentication: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );
    
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            String jwt = tokenProvider.generateToken(authentication);
            
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userDetails.getEmail()));
            
            return ResponseEntity.ok(new JwtResponse(jwt, user));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Login failed: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity
                .badRequest()
                .body("Error: Email is already in use!");
        }

        // Set default role if not specified
        if (user.getRole() == null) {
            user.setRole(User.UserRole.CUSTOMER);
        }

        // Encode password
        if(user.getPassword()!= null){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // Save user
        User registeredUser = userRepository.save(user);

        return ResponseEntity.ok(registeredUser);
    }

    @PostMapping("/registertmanager")
    public ResponseEntity<?> registerTManager(@Valid @RequestBody User user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity
                .badRequest()
                .body("Error: Email is already in use!");
        }

        String originalPassword = user.getPassword();
        
        // Set default role if not specified
        if (user.getRole() == null) {
            user.setRole(User.UserRole.THEATER_MANAGER);
        }

        // Encode password
        if(user.getPassword()!= null){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // Save user
        User registeredUser = userRepository.save(user);

        try {
            emailService.sendCredentialsMail(
                registeredUser.getEmail(),
                registeredUser.getUsername(),
                originalPassword
            );
        } catch (Exception e) {
            // Log the error but don't fail the registration
            System.err.println("Failed to send email: " + e.getMessage());
        }

        return ResponseEntity.ok(registeredUser);
    }

    // Optional: Add endpoint to check if email exists
    @GetMapping("/check-email/{email}")
    public ResponseEntity<?> checkEmailAvailability(@PathVariable String email) {
        Boolean emailExists = userRepository.existsByEmail(email);
        return ResponseEntity.ok(!emailExists);
    }

    // Optional: Add endpoint to get current user details
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        User user = userRepository.findByEmail(userDetails.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
public ResponseEntity<?> logoutUser(HttpServletRequest request) {
    try {
        // Get the JWT token from the request
        String jwt = getJwtFromRequest(request);
        
        if (jwt != null && !jwt.isEmpty()) {
            // You could implement a token blacklist here
            // This would require storing invalidated tokens until they expire
            // tokenBlacklistService.addToBlacklist(jwt);
        }
        
        // Clear the security context
        SecurityContextHolder.clearContext();
        
        return ResponseEntity.ok().body("Logged out successfully");
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Error during logout: " + e.getMessage());
    }
}

// Helper method to extract JWT token from request
private String getJwtFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
        return bearerToken.substring(7);
    }
    return null;
}
}