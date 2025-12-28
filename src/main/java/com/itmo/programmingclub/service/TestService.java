package com.itmo.programmingclub.service;

import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.dto.TestDTO;
import com.itmo.programmingclub.model.entity.Task;
import com.itmo.programmingclub.model.entity.Test;
import com.itmo.programmingclub.repository.TaskRepository;
import com.itmo.programmingclub.repository.TestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TestService {
    private final TestRepository testRepository;
    private final TaskRepository taskRepository;

    public Test createTest(Integer taskId, TestDTO testDTO, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        if (!task.getAuthor().getUsername().equals(username)) {
            throw new AccessDeniedException("You can only add tests to your own tasks");
        }

        Test test = new Test();
        test.setInput(testDTO.getInput());
        test.setOutput(testDTO.getOutput());
        test.setTask(task);

        return testRepository.save(test);
    }

    public List<Test> getTestsByTaskId(Integer taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new NotFoundException("Task not found");
        }
        return testRepository.findByTaskId(taskId);
    }

    public void deleteTest(Integer testId, String username) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));

        if (!test.getTask().getAuthor().getUsername().equals(username)) {
            throw new AccessDeniedException("You can only delete tests from your own tasks");
        }

        testRepository.delete(test);
    }

    public Test updateTest(Integer testId, TestDTO testDTO, String username) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new NotFoundException("Test not found"));

        if (!test.getTask().getAuthor().getUsername().equals(username)) {
            throw new AccessDeniedException("You can only edit tests for your own tasks");
        }

        test.setInput(testDTO.getInput());
        test.setOutput(testDTO.getOutput());

        return testRepository.save(test);
    }
}
