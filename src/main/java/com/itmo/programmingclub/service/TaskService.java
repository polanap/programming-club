package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.dto.TaskDTO;
import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.model.entity.Task;
import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.repository.ClassRepository;
import com.itmo.programmingclub.repository.TaskRepository;
import com.itmo.programmingclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskService {
    private final TaskRepository taskRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;

    public Task createTask(TaskDTO taskDTO, String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        Task task = new Task();
        task.setCondition(taskDTO.getCondition());
        task.setAuthor(author);
        task.setIsOpen(taskDTO.getIsOpen() != null ? taskDTO.getIsOpen() : true);

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

    public Task updateTask(Integer taskId, TaskDTO taskDTO, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found"));
        if (!task.getAuthor().getUsername().equals(username)) {
            throw new AccessDeniedException("You can only edit your own tasks");
        }
        task.setCondition(taskDTO.getCondition());
        if (taskDTO.getIsOpen() != null) {
            task.setIsOpen(taskDTO.getIsOpen());
        }
        return taskRepository.save(task);
    }

    public void deleteTask(Integer taskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        if (!task.getAuthor().getUsername().equals(username)) {
            throw new AccessDeniedException("You can only delete your own tasks");
        }

        taskRepository.delete(task);
    }

    public void assignTaskToClass(Integer classId, Integer taskId, String username) {
        com.itmo.programmingclub.model.entity.Class classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NoSuchElementException("Class not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        boolean isAuthor = task.getAuthor().getId().equals(currentUser.getId());
        boolean isOpen = Boolean.TRUE.equals(task.getIsOpen());

        if (!isAuthor && !isOpen) {
            throw new AccessDeniedException("You can only assign your own tasks or open tasks");
        }

        classEntity.addTask(task);
        classRepository.save(classEntity);
    }

    public void removeTaskFromClass(Integer classId, Integer taskId) {
        Class classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NoSuchElementException("Class not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        classEntity.removeTask(task);
        classRepository.save(classEntity);
    }
}

