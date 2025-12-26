package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
    List<UserRole> findByUserId(Integer userId);
    Optional<UserRole> findByUserIdAndRoleId(Integer userId, Integer roleId);
}

