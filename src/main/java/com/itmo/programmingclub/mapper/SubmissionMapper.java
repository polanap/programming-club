package com.itmo.programmingclub.mapper;

import com.itmo.programmingclub.model.dto.SubmissionResponseDTO;
import com.itmo.programmingclub.model.entity.Submission;
import org.springframework.stereotype.Component;

@Component
public class SubmissionMapper {

    public SubmissionResponseDTO toDto(Submission submission) {
        if (submission == null) return null;

        return SubmissionResponseDTO.builder()
                .id(submission.getId())
                .completionTimeMs(submission.getComplitionTime() != null ?
                        submission.getComplitionTime().toMillis() : 0L)
                .taskId(submission.getTask() != null ? submission.getTask().getId() : null)
                .teamId(submission.getTeam() != null ? submission.getTeam().getId() : null)
                .code(submission.getCode())
                .language(submission.getLanguage())
                .status(submission.getStatus())
                .build();
    }
}