package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, Integer> {
    List<TransferRequest> findByStudentId(Integer studentId);
    List<TransferRequest> findByManagerId(Integer managerId);
    List<TransferRequest> findByStatus(TransferRequest.TransferRequestStatus status);
}

