package com.moviebuff.moviebuff_backend.security;

public class GoogleAuthRequest {
    private String idToken;
    
    public String getIdToken() {
        return idToken;
    }
    
    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}