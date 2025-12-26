package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.UserTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTeamRepository extends JpaRepository<UserTeam, UserTeam.UserTeamId> {
    List<UserTeam> findByTeamId(Integer teamId);
    List<UserTeam> findByUserRoleId(Integer userRoleId);
}

