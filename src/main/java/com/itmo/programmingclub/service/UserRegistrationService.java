package com.itmo.programmingclub.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserRegistrationService {
    @PersistenceContext
    private EntityManager entityManager;

    public void registerUser(String username, String fullName, String email, String password, String role) {
        String sql = "SELECT register_user(:username, :fullName, :email, :password, :role)";
        entityManager.createNativeQuery(sql)
                .setParameter("username", username)
                .setParameter("fullName", fullName)
                .setParameter("email", email)
                .setParameter("password", password)
                .setParameter("role", role)
                .getResultList();
    }
}

