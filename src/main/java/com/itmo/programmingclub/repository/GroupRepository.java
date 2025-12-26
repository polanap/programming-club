package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.Group;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Integer> {
    @Query("SELECT DISTINCT g FROM Group g JOIN g.userRoleGroups urg JOIN urg.userRole ur JOIN ur.user u WHERE u.id = :userId")
    List<Group> findByUserId(@Param("userId") Integer userId);
}

