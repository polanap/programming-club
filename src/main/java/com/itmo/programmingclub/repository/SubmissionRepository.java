package com.itmo.programmingclub.repository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.Submission;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
    @Query("SELECT s FROM Submission s WHERE s.team.id = :teamId ORDER BY s.id DESC")
    List<Submission> findByTeamIdOrderByIdDesc(@Param("teamId") Integer teamId);
    
    List<Submission> findByTeamId(Integer teamId);
    List<Submission> findByTaskId(Integer taskId);
    List<Submission> findByTeamIdAndTaskId(Integer teamId, Integer taskId);

    List<Submission> findByStatus(Submission.SubmissionStatus status, PageRequest pageRequest);
}

