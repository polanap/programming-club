package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.Task;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Integer> {
    List<Task> findByAuthorId(Integer authorId);
    List<Task> findByIsOpenTrue();
    List<Task> findByAuthorIdOrIsOpenTrue(Integer authorId, Boolean isOpen);
}

