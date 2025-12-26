package com.itmo.programmingclub.service;

import com.itmo.programmingclub.entity.ElderChangeRequest;
import com.itmo.programmingclub.repository.ElderChangeRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ElderChangeRequestService {
    private final ElderChangeRequestRepository elderChangeRequestRepository;

    public ElderChangeRequest createElderChangeRequest(ElderChangeRequest request) {
        return elderChangeRequestRepository.save(request);
    }

    public Optional<ElderChangeRequest> findById(Integer id) {
        return elderChangeRequestRepository.findById(id);
    }

    public List<ElderChangeRequest> findAll() {
        return elderChangeRequestRepository.findAll();
    }

    public List<ElderChangeRequest> findByStudentId(Integer studentId) {
        return elderChangeRequestRepository.findByStudentId(studentId);
    }

    public List<ElderChangeRequest> findByStatus(ElderChangeRequest.RequestStatus status) {
        return elderChangeRequestRepository.findByStatus(status);
    }

    public ElderChangeRequest updateElderChangeRequest(ElderChangeRequest request) {
        return elderChangeRequestRepository.save(request);
    }
}

