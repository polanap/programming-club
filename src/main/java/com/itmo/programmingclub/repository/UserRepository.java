package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    
    @Query(value = "SELECT COUNT(*) > 0 FROM app_user WHERE username = :username", nativeQuery = true)
    boolean existsByUsername(@Param("username") String username);
    
    @Query(value = "SELECT COUNT(*) > 0 FROM app_user WHERE email = :email", nativeQuery = true)
    boolean existsByEmail(@Param("email") String email);
}

