package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.TeamChangeRequest;

import java.util.List;

@Repository
public interface TeamChangeRequestRepository extends JpaRepository<TeamChangeRequest, Integer> {
    List<TeamChangeRequest> findByStudentId(Integer studentId);
    List<TeamChangeRequest> findByStatus(TeamChangeRequest.RequestStatus status);
    @Query("SELECT tcr FROM TeamChangeRequest tcr WHERE tcr.fromTeam.classEntity.id = :classId OR tcr.toTeam.classEntity.id = :classId")
    List<TeamChangeRequest> findByClassId(@Param("classId") Integer classId);
}

