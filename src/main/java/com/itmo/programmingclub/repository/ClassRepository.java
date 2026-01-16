package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.Class;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<Class, Integer> {
    List<Class> findByScheduleId(Integer scheduleId);
    
    Optional<Class> findByScheduleIdAndClassDate(Integer scheduleId, LocalDate classDate);
    
    boolean existsByScheduleIdAndClassDate(Integer scheduleId, LocalDate classDate);
    
    @Query("SELECT c FROM Class c JOIN c.schedule s WHERE s.group.id = :groupId")
    List<Class> findByGroupId(@Param("groupId") Integer groupId);
    
    @Query("""
        SELECT DISTINCT c FROM Class c 
        LEFT JOIN FETCH c.tasks
        JOIN c.schedule s 
        JOIN s.group g 
        JOIN g.userRoles ur 
        JOIN ur.user u 
        JOIN ur.role r 
        WHERE u.id = :userId AND r.role = :role
        ORDER BY c.classDate DESC
        """)
    List<Class> findByCuratorId(@Param("userId") Integer userId, RoleEnum role);
    
    @Query("SELECT c FROM Class c LEFT JOIN FETCH c.tasks WHERE c.id = :id")
    Optional<Class> findByIdWithTasks(@Param("id") Integer id);
}

