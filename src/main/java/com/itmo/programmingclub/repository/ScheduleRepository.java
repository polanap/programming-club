package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {
    List<Schedule> findByGroupId(Integer groupId);
    List<Schedule> findByGroupIdAndIsRelevantTrue(Integer groupId);
}

