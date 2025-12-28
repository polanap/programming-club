package com.itmo.programmingclub.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    
    @Query(value = "SELECT COUNT(*) > 0 FROM app_user WHERE username = :username", nativeQuery = true)
    boolean existsByUsername(@Param("username") String username);
    
    @Query(value = "SELECT COUNT(*) > 0 FROM app_user WHERE email = :email", nativeQuery = true)
    boolean existsByEmail(@Param("email") String email);
    
    @Query(value = """
        SELECT DISTINCT u.* FROM app_user u
        INNER JOIN user_role ur ON u.id = ur.user_id
        INNER JOIN app_role r ON ur.role_id = r.id
        WHERE r.role = 'MANAGER' AND u.is_active = false
        ORDER BY u.registration_date DESC
        """,
        countQuery = """
        SELECT COUNT(DISTINCT u.id) FROM app_user u
        INNER JOIN user_role ur ON u.id = ur.user_id
        INNER JOIN app_role r ON ur.role_id = r.id
        WHERE r.role = 'MANAGER' AND u.is_active = false
        """,
        nativeQuery = true)
    Page<User> findInactiveManagers(Pageable pageable);
    
    @Query(value = """
        SELECT COUNT(*) > 0 FROM app_user u
        INNER JOIN user_role ur ON u.id = ur.user_id
        INNER JOIN app_role r ON ur.role_id = r.id
        WHERE u.id = :userId AND r.role = 'MANAGER'
        """, nativeQuery = true)
    boolean isManager(@Param("userId") Integer userId);
    
    @Query(value = """
        SELECT DISTINCT u.* FROM app_user u
        INNER JOIN user_role ur ON u.id = ur.user_id
        INNER JOIN app_role r ON ur.role_id = r.id
        WHERE r.role = 'STUDENT' AND u.is_active = true
        ORDER BY u.full_name
        """, nativeQuery = true)
    List<User> findAllStudents();
    
    @Query(value = """
        SELECT DISTINCT u.* FROM app_user u
        INNER JOIN user_role ur ON u.id = ur.user_id
        INNER JOIN app_role r ON ur.role_id = r.id
        WHERE r.role = 'CURATOR' AND u.is_active = true
        ORDER BY u.full_name
        """, nativeQuery = true)
    List<User> findAllCurators();
    
    @Query(value = """
        SELECT DISTINCT u.* FROM app_user u
        INNER JOIN user_role ur ON u.id = ur.user_id
        INNER JOIN app_role r ON ur.role_id = r.id
        WHERE r.role = 'MANAGER' AND u.is_active = true
        ORDER BY u.full_name
        """, nativeQuery = true)
    List<User> findAllManagers();
}

