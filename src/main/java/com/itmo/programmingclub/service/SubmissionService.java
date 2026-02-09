package com.itmo.programmingclub.service;

import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.dto.SubmissionDTO;
import com.itmo.programmingclub.model.entity.Submission;
import com.itmo.programmingclub.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionService {
    private final SubmissionRepository submissionRepository;

    public Submission createSubmission(Submission submission) {
        return submissionRepository.save(submission);
    }

    public Optional<Submission> findById(Integer id) {
        return submissionRepository.findById(id);
    }

    public List<Submission> findAll() {
        return submissionRepository.findAll();
    }

    public List<Submission> findByTeamId(Integer teamId) {
        return submissionRepository.findByTeamId(teamId);
    }

    public List<Submission> findByTaskId(Integer taskId) {
        return submissionRepository.findByTaskId(taskId);
    }

    public List<Submission> findByTeamIdAndTaskId(Integer teamId, Integer taskId) {
        return submissionRepository.findByTeamIdAndTaskId(teamId, taskId);
    }

    public Submission updateSubmission(Submission submission) {
        return submissionRepository.save(submission);
    }
}
