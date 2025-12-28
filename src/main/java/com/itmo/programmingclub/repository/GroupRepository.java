package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.Group;
import com.itmo.programmingclub.model.RoleEnum;
import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Integer> {
    @Query("SELECT DISTINCT g FROM Group g JOIN g.userRoles ur JOIN ur.user u WHERE u.id = :userId")
    List<Group> findByUserId(@Param("userId") Integer userId);
    
    @Query("""
        SELECT DISTINCT g
        FROM Group g
        JOIN g.userRoles ur
        JOIN ur.user u
        JOIN ur.role r
        WHERE u.id = :userId AND r.role = :role
        """)
    List<Group> findByUserIdAndRole(@Param("userId") Integer userId, @Param("role") RoleEnum role);
}
