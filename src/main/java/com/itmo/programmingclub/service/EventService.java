package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.entity.Event;
import com.itmo.programmingclub.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {
    private final EventRepository eventRepository;

    public Event createEvent(Event event) {
        return eventRepository.save(event);
    }

    public Optional<Event> findById(Integer id) {
        return eventRepository.findById(id);
    }

    public List<Event> findAll() {
        return eventRepository.findAll();
    }

    public List<Event> findByClassId(Integer classId) {
        return eventRepository.findByClassEntityId(classId);
    }

    public List<Event> findByTimeRange(OffsetDateTime startTime, OffsetDateTime endTime) {
        return eventRepository.findByTimeBetween(startTime, endTime);
    }

    public List<Event> findByClassIdAndTimeRange(Integer classId, OffsetDateTime startTime, OffsetDateTime endTime) {
        return eventRepository.findByClassEntityIdAndTimeBetween(classId, startTime, endTime);
    }

    public List<Event> findByTeamId(Integer teamId) {
        return eventRepository.findByTeamId(teamId);
    }
}

