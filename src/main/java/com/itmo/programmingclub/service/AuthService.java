package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.dto.AuthRequest;
import com.itmo.programmingclub.model.dto.AuthResponse;
import com.itmo.programmingclub.model.dto.RegisterRequest;
import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.repository.UserRepository;
import com.itmo.programmingclub.security.CustomUserDetails;
import com.itmo.programmingclub.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRegistrationService userRegistrationService;

    public AuthResponse login(AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();
        List<String> roles = userDetails.getUserRoles().stream()
                .map(ur -> ur.getRole().getRole())
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(roles)
                .build();
    }

    public void register(RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        // Use database function to register user
        // The function handles user creation, role assignment, and is_active setting
        // Password needs to be hashed before passing to the function
        String role = signUpRequest.getRole().toUpperCase();
        String hashedPassword = passwordEncoder.encode(signUpRequest.getPassword());
        
        userRegistrationService.registerUser(
                signUpRequest.getUsername(),
                signUpRequest.getFullName(),
                signUpRequest.getEmail(),
                hashedPassword,
                role
        );
    }
}

