package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.entity.Submission.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponseDTO {
    private Integer id;
    private Long completionTimeMs; // Время выполнения в миллисекундах (удобнее для фронтенда)
    private Integer taskId;
    private Integer teamId;
    private String code;
    private String language;
    private SubmissionStatus status;
}