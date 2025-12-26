package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Integer> {
    List<Team> findByClassEntityId(Integer classId);
}

