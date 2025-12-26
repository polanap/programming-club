package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.entity.TeamChangeRequest;
import com.itmo.programmingclub.repository.TeamChangeRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamChangeRequestService {
    private final TeamChangeRequestRepository teamChangeRequestRepository;

    public TeamChangeRequest createTeamChangeRequest(TeamChangeRequest request) {
        return teamChangeRequestRepository.save(request);
    }

    public Optional<TeamChangeRequest> findById(Integer id) {
        return teamChangeRequestRepository.findById(id);
    }

    public List<TeamChangeRequest> findAll() {
        return teamChangeRequestRepository.findAll();
    }

    public List<TeamChangeRequest> findByStudentId(Integer studentId) {
        return teamChangeRequestRepository.findByStudentId(studentId);
    }

    public List<TeamChangeRequest> findByStatus(TeamChangeRequest.RequestStatus status) {
        return teamChangeRequestRepository.findByStatus(status);
    }

    public TeamChangeRequest updateTeamChangeRequest(TeamChangeRequest request) {
        return teamChangeRequestRepository.save(request);
    }
}

