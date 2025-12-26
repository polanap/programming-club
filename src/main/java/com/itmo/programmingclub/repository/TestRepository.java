package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Integer> {
    List<Test> findByTaskId(Integer taskId);
}

