package com.itmo.programmingclub.service;

import java.util.List;

import org.springframework.boot.webmvc.autoconfigure.WebMvcProperties.Apiversion.Use;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itmo.programmingclub.model.entity.Role;
import com.itmo.programmingclub.repository.UserRoleRepository;
import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.UserRole;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserRoleService {
    private final UserRoleRepository userRoleRepository;
    private final RoleService roleService;
    
    public boolean isUserHasRole(Integer userId, RoleEnum role) {
        Role roleEntity = roleService.findByRole(role);
        return userRoleRepository.findByUserIdAndRoleId(userId, roleEntity.getId()).isPresent();
    }

    public boolean userHasRoleOrThrow(Integer userId, RoleEnum role) {
        if (!isUserHasRole(userId, role)) {
            throw new IllegalArgumentException("User does not have role: " + role);
        }
        return true;
    }

    public UserRole createUserRole(UserRole userRole) {
        return userRoleRepository.save(userRole);
    }

    public UserRole findById(Integer id) {
        return userRoleRepository.findById(id).orElseThrow(() -> new NotFoundException("UserRole not found"));
    }

    public UserRole findByUserIdAndRole(Integer userId, RoleEnum role) {
        Role roleEntity = roleService.findByRole(role);
        return userRoleRepository.findByUserIdAndRoleId(userId, roleEntity.getId()).orElseThrow(() -> new NotFoundException("UserRole not found"));
    }

    public List<UserRole> findByUserId(Integer userId) {
        return userRoleRepository.findByUserId(userId);
    }
}
