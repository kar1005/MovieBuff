// src/main/java/com/moviebuff/repository/interfaces/user/IUserRepository.java
package com.moviebuff.moviebuff_backend.repository.interfaces.user;

import com.moviebuff.moviebuff_backend.model.user.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IUserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    List<User> findByRole(User.UserRole role);
}