package com.itmo.programmingclub.service;

import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.Role;
import com.itmo.programmingclub.repository.RoleRepository;
import com.itmo.programmingclub.exceptions.NotFoundException;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleService {
    private final RoleRepository roleRepository;

    public Role findByRole(RoleEnum role) {
        return roleRepository.findByRole(role).orElseThrow(() -> new NotFoundException("Role not found"));
    }
}
