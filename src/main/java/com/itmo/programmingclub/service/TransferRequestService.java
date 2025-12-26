package com.itmo.programmingclub.service;

import com.itmo.programmingclub.entity.TransferRequest;
import com.itmo.programmingclub.repository.TransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class TransferRequestService {
    private final TransferRequestRepository transferRequestRepository;

    public TransferRequest createTransferRequest(TransferRequest request) {
        return transferRequestRepository.save(request);
    }

    public Optional<TransferRequest> findById(Integer id) {
        return transferRequestRepository.findById(id);
    }

    public List<TransferRequest> findAll() {
        return transferRequestRepository.findAll();
    }

    public List<TransferRequest> findByStudentId(Integer studentId) {
        return transferRequestRepository.findByStudentId(studentId);
    }

    public List<TransferRequest> findByManagerId(Integer managerId) {
        return transferRequestRepository.findByManagerId(managerId);
    }

    public List<TransferRequest> findByStatus(TransferRequest.TransferRequestStatus status) {
        return transferRequestRepository.findByStatus(status);
    }

    public TransferRequest updateTransferRequest(TransferRequest request) {
        return transferRequestRepository.save(request);
    }
}

