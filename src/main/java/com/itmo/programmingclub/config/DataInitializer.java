package com.itmo.programmingclub.config;

import com.itmo.programmingclub.entity.Role;
import com.itmo.programmingclub.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        initializeRoles();
    }

    private void initializeRoles() {
        if (roleRepository.count() == 0) {
            log.info("Initializing roles...");
            
            Role studentRole = new Role();
            studentRole.setRole("STUDENT");
            roleRepository.save(studentRole);
            
            Role curatorRole = new Role();
            curatorRole.setRole("CURATOR");
            roleRepository.save(curatorRole);
            
            Role managerRole = new Role();
            managerRole.setRole("MANAGER");
            roleRepository.save(managerRole);
            
            log.info("Roles initialized successfully");
        } else {
            log.info("Roles already exist, skipping initialization");
        }
    }
}

