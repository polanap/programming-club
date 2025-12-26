package com.itmo.programmingclub.security;

import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.model.entity.UserRole;
import com.itmo.programmingclub.repository.UserRepository;
import com.itmo.programmingclub.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
        
        return new CustomUserDetails(user, userRoles);
    }
}

