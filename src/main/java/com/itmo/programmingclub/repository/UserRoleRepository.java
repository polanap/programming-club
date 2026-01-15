package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.UserRole;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
    @Query("SELECT ur FROM UserRole ur JOIN FETCH ur.role WHERE ur.user.id = :userId")
    List<UserRole> findByUserId(@Param("userId") Integer userId);
    
    Optional<UserRole> findByUserIdAndRoleId(Integer userId, Integer roleId);

    Optional<UserRole> findByUser_UsernameAndRole_Role(String username, RoleEnum role);

    List<UserRole> findByGroups_Id(Integer groupId);
}

