package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.entity.Submission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDTO {
    private Integer id;
    private Duration complitionTime;
    private Integer taskId;
    private Integer teamId;
    private Submission.SubmissionStatus status;

    public static SubmissionDTO fromEntity(Submission submission) {
        if (submission == null) {
            return null;
        }

        return SubmissionDTO.builder()
                .id(submission.getId())
                .complitionTime(submission.getComplitionTime())
                .taskId(submission.getTask() != null ? submission.getTask().getId() : null)
                .teamId(submission.getTeam() != null ? submission.getTeam().getId() : null)
                .status(submission.getStatus())
                .build();
    }
}
