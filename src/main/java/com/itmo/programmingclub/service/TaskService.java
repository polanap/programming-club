package com.itmo.programmingclub.service;

import com.itmo.programmingclub.entity.Task;
import com.itmo.programmingclub.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskService {
    private final TaskRepository taskRepository;

    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    public Optional<Task> findById(Integer id) {
        return taskRepository.findById(id);
    }

    public List<Task> findAll() {
        return taskRepository.findAll();
    }

    public List<Task> findByAuthorId(Integer authorId) {
        return taskRepository.findByAuthorId(authorId);
    }

    public List<Task> findOpenTasks() {
        return taskRepository.findByIsOpenTrue();
    }

    public List<Task> findAvailableTasksForCurator(Integer curatorId) {
        return taskRepository.findByAuthorIdOrIsOpenTrue(curatorId, true);
    }

    public Task updateTask(Task task) {
        return taskRepository.save(task);
    }

    public void deleteTask(Integer id) {
        taskRepository.deleteById(id);
    }
}

