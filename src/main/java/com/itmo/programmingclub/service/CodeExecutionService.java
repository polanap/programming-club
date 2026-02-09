package com.itmo.programmingclub.service;

import com.github.codeboy.piston4j.api.CodeFile;
import com.github.codeboy.piston4j.api.ExecutionRequest;
import com.github.codeboy.piston4j.api.ExecutionResult;
import com.github.codeboy.piston4j.api.Piston;
import com.github.codeboy.piston4j.api.Runtime;
import com.itmo.programmingclub.model.entity.Event;
import com.itmo.programmingclub.model.entity.Submission;
import com.itmo.programmingclub.model.entity.Task;
import com.itmo.programmingclub.model.entity.Test;
import com.itmo.programmingclub.repository.EventRepository;
import com.itmo.programmingclub.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeExecutionService {

    private final SubmissionRepository submissionRepository;
    private final EventRepository eventRepository;
    private final Piston piston;

    @Async
    @Transactional
    public void executeSubmission(Integer submissionId) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return;

        if (submission.getStatus() == Submission.SubmissionStatus.NEW) {
            submission.setStatus(Submission.SubmissionStatus.IN_PROCESS);
        }

        Task task = submission.getTask();
        List<Test> tests = task.getTests().stream().toList();
        String sourceCode = submission.getCode();
        String language = submission.getLanguage();

        log.info("Starting Piston execution for submission {}", submissionId);
        Instant start = Instant.now();

        try {
            Runtime runtime = piston.getRuntime(language)
                    .orElseThrow(() -> new IllegalArgumentException("Language not found: " + language));

            if (tests.isEmpty()) {
                log.warn("Task {} has no tests. Marking as OK.", task.getId());
            }

            boolean allTestsPassed = true;

            for (Test test : tests) {
                ExecutionResult result = runCode(runtime, sourceCode, language, test.getInput());

                String output = result.getOutput().getOutput();

                if (result.getCompileOutput() != null && result.getCompileOutput().getCode() != 0) {
                    allTestsPassed = false;
                    log.info("Compile Error: {}", result.getCompileOutput().getOutput());
                    break;
                }

                String actual = output.trim();
                String expected = test.getOutput().trim();

                if (!actual.equals(expected)) {
                    allTestsPassed = false;
                    log.info("Test failed. Expected: '{}', Actual: '{}'", expected, actual);
                    break;
                }
            }

            submission.setStatus(allTestsPassed ? Submission.SubmissionStatus.OK : Submission.SubmissionStatus.FAILED);

        } catch (Exception e) {
            log.error("Error executing submission {}", submissionId, e);
            submission.setStatus(Submission.SubmissionStatus.FAILED);
        } finally {
            submission.setComplitionTime(Duration.between(start, Instant.now()));
            submissionRepository.save(submission);

            // Создаём запись в логе
            createResultEvent(submission);

            log.info("Finished submission {}. Status: {}", submissionId, submission.getStatus());
        }
    }

    private void createResultEvent(Submission submission) {
        Event event = new Event();
        event.setType(Event.EventType.RESULT_OF_SOLUTION); // Тип события
        event.setTime(OffsetDateTime.now());

        event.setSubmission(submission);
        event.setTeam(submission.getTeam());
        event.setTask(submission.getTask());
        event.setClassEntity(submission.getTeam().getClassEntity());

        eventRepository.save(event);
    }

    private ExecutionResult runCode(Runtime runtime, String code, String language, String stdin) {
        String fileName = getFileName(language);
        CodeFile codeFile = new CodeFile(fileName, code);

        ExecutionRequest request = new ExecutionRequest(
                runtime.getLanguage(),
                runtime.getVersion(),
                codeFile
        );
        request.setStdin(stdin);

        return piston.execute(request);
    }

    private String getFileName(String language) {
        return switch (language.toLowerCase()) {
            case "java" -> "Main.java";
            case "python", "py" -> "main.py";
            default -> "code.txt";
        };
    }
}