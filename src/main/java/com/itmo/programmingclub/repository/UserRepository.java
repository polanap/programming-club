package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Modifying
    @Query(value = "SELECT s409218.register_user(:username, :fullName, :email, :password, :role) FROM (VALUES(0)) AS dummy", nativeQuery = true)
    void registerUser(@Param("username") String username,
                      @Param("fullName") String fullName,
                      @Param("email") String email,
                      @Param("password") String password,
                      @Param("role") String role);
}

