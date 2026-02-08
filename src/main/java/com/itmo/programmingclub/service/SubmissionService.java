package com.itmo.programmingclub.service;

import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.dto.SubmissionRequestDTO;
import com.itmo.programmingclub.model.entity.Submission;
import com.itmo.programmingclub.model.entity.Task;
import com.itmo.programmingclub.model.entity.UserRole;
import com.itmo.programmingclub.model.entity.UserTeam;
import com.itmo.programmingclub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final TaskRepository taskRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserTeamRepository userTeamRepository;

    public Submission createSubmission(Integer taskId, SubmissionRequestDTO dto, String username) {
        UserRole studentRole = userRoleRepository.findByUser_UsernameAndRole_Role(username, RoleEnum.STUDENT)
                .orElseThrow(() -> new NotFoundException("Student role not found for user: " + username));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        UserTeam currentTeam = userTeamRepository.findTopByUserRole_IdOrderByTeam_IdDesc(studentRole.getId())
                .orElseThrow(() -> new IllegalArgumentException("Student is not in a team"));


        Submission submission = new Submission();
        submission.setTask(task);
        submission.setTeam(currentTeam.getTeam());
        submission.setCode(dto.getCode());
        submission.setLanguage(dto.getLanguage());
        submission.setStatus(Submission.SubmissionStatus.IN_PROCESS);
        submission.setComplitionTime(Duration.ZERO);

        return submissionRepository.save(submission);
    }

    public Submission findById(Integer id) {
        return submissionRepository.findById(id).orElseThrow(() -> new NotFoundException("Submission not found"));
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

