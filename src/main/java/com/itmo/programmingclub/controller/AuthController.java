package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.dto.AuthRequest;
import com.itmo.programmingclub.dto.AuthResponse;
import com.itmo.programmingclub.dto.RegisterRequest;
import com.itmo.programmingclub.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest signUpRequest) {
        authService.register(signUpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully!");
    }
}

