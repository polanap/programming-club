package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.UserTeam;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTeamRepository extends JpaRepository<UserTeam, UserTeam.UserTeamId> {
    List<UserTeam> findByTeamId(Integer teamId);
    List<UserTeam> findByUserRoleId(Integer userRoleId);
    Optional<UserTeam> findTopByUserRole_IdOrderByTeam_IdDesc(Integer userRoleId);
}

