package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.TeamChangeRequest;

import java.util.List;

@Repository
public interface TeamChangeRequestRepository extends JpaRepository<TeamChangeRequest, Integer> {
    List<TeamChangeRequest> findByStudentId(Integer studentId);
    List<TeamChangeRequest> findByStatus(TeamChangeRequest.RequestStatus status);
}

