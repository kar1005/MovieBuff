package com.moviebuff.moviebuff_backend.payload.response;

import com.moviebuff.moviebuff_backend.model.user.User;
import lombok.Data;

@Data
public class JwtResponse {
    private String token;
    private String id;
    private String username;
    private String email;
    private User.UserRole role;

    public JwtResponse(String token, User user) {
        this.token = token;
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.role = user.getRole();
    }
}
