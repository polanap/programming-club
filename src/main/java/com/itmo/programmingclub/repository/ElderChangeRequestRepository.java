package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.ElderChangeRequest;

import java.util.List;

@Repository
public interface ElderChangeRequestRepository extends JpaRepository<ElderChangeRequest, Integer> {
    List<ElderChangeRequest> findByStudentId(Integer studentId);
    List<ElderChangeRequest> findByStatus(ElderChangeRequest.RequestStatus status);
}

