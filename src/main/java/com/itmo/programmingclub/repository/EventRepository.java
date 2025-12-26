package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.Event;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    List<Event> findByClassEntityId(Integer classId);
    List<Event> findByTimeBetween(OffsetDateTime startTime, OffsetDateTime endTime);
    List<Event> findByClassEntityIdAndTimeBetween(Integer classId, OffsetDateTime startTime, OffsetDateTime endTime);
    List<Event> findByTeamId(Integer teamId);
}

