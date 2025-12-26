package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.Submission;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
    List<Submission> findByTeamId(Integer teamId);
    List<Submission> findByTaskId(Integer taskId);
    List<Submission> findByTeamIdAndTaskId(Integer teamId, Integer taskId);
}

