package com.itmo.programmingclub.config;

import org.springframework.context.annotation.Configuration;

/**
 * WebSocket security configuration
 * 
 * Note: WebSocket security is handled through the main SecurityConfig.
 * In Spring Security 6.x (used by Spring Boot 4.0), WebSocket security
 * is integrated into the main SecurityFilterChain configuration.
 */
@Configuration
public class WebSocketSecurityConfig {
    // WebSocket security is configured in SecurityConfig.java
    // All WebSocket endpoints require authentication via JWT tokens
}

