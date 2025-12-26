package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.ElderChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ElderChangeRequestRepository extends JpaRepository<ElderChangeRequest, Integer> {
    List<ElderChangeRequest> findByStudentId(Integer studentId);
    List<ElderChangeRequest> findByStatus(ElderChangeRequest.RequestStatus status);
}

