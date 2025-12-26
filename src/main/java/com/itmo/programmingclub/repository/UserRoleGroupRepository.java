package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.UserRoleGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleGroupRepository extends JpaRepository<UserRoleGroup, UserRoleGroup.UserRoleGroupId> {
    List<UserRoleGroup> findByGroupId(Integer groupId);
    List<UserRoleGroup> findByUserRoleId(Integer userRoleId);
}

