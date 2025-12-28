package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.dto.InactiveManagerResponse;
import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ManagerActivationService {
    private final UserRepository userRepository;

    public Page<InactiveManagerResponse> getInactiveManagers(Pageable pageable) {
        Page<User> inactiveManagers = userRepository.findInactiveManagers(pageable);
        
        return inactiveManagers.map(user -> InactiveManagerResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .registrationDate(user.getRegistrationDate())
                .build());
    }

    public void activateManager(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verify user is a manager
        if (!userRepository.isManager(userId)) {
            throw new IllegalArgumentException("User is not a manager");
        }

        // Verify user is not already active
        if (user.getIsActive()) {
            throw new IllegalArgumentException("User is already active");
        }

        // Activate user
        user.setIsActive(true);
        userRepository.save(user);
    }
}
