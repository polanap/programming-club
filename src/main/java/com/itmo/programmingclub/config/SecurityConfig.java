package com.itmo.programmingclub.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.itmo.programmingclub.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Manager endpoints
                        // .requestMatchers("/api/managers/**").hasRole("MANAGER")
                        // .requestMatchers("/api/groups/**").hasRole("MANAGER")
                        // .requestMatchers("POST", "/api/classes").hasRole("MANAGER")
                        // .requestMatchers("PUT", "/api/classes/{id}").hasRole("MANAGER")
                        // .requestMatchers("DELETE", "/api/classes/{id}").hasRole("MANAGER")
                        // Curator endpoints - must be before general class endpoints
                        // .requestMatchers("POST", "/api/classes/**/tasks/**").hasRole("CURATOR")
                        // .requestMatchers("DELETE", "/api/classes/**/tasks/**").hasRole("CURATOR")
                        // .requestMatchers("POST", "/api/tasks").hasRole("CURATOR")
                        // .requestMatchers("PUT", "/api/tasks/**").hasRole("CURATOR")
                        // .requestMatchers("DELETE", "/api/tasks/**").hasRole("CURATOR")
                        // .requestMatchers("/api/tasks/curator/**").hasRole("CURATOR")
                        // Authenticated endpoints
                        // .requestMatchers("POST", "/api/tasks/**/tests").authenticated()
                        // .requestMatchers("PUT", "/api/tests/**").authenticated()
                        // .requestMatchers("DELETE", "/api/tests/**").authenticated()
                        .requestMatchers("/api/transfer-request/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173")); // React dev servers
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

