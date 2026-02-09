package com.itmo.programmingclub.scheduler;

import com.itmo.programmingclub.model.entity.Submission;
import com.itmo.programmingclub.repository.SubmissionRepository;
import com.itmo.programmingclub.service.CodeExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubmissionScheduler {

    private final SubmissionRepository submissionRepository;
    private final CodeExecutionService codeExecutionService;

    @Scheduled(fixedDelayString = "${app.scheduler.submission-check-rate:2000}")
    @Transactional
    public void processNewSubmissions() {
        // 1. Берем пачку новых решений (например, 20 штук за раз, чтобы не забить память)
        List<Submission> newSubmissions = submissionRepository.findByStatus(
                Submission.SubmissionStatus.NEW,
                PageRequest.of(0, 20)
        );

        if (newSubmissions.isEmpty()) {
            return;
        }

        log.info("Found {} new submissions to process", newSubmissions.size());

        for (Submission submission : newSubmissions) {
            submission.setStatus(Submission.SubmissionStatus.IN_PROCESS);
            submissionRepository.save(submission);

            codeExecutionService.executeSubmission(submission.getId());
        }
    }
}