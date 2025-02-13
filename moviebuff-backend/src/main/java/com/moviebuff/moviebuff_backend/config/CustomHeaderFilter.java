package com.moviebuff.moviebuff_backend.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class CustomHeaderFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Allow communication between different origins
        httpResponse.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        httpResponse.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        httpResponse.setHeader("Access-Control-Allow-Origin", "http://localhost:3000"); // Adjust for production
        httpResponse.setHeader("Access-Control-Allow-Credentials", "true");

        chain.doFilter(request, response);
    }
}

