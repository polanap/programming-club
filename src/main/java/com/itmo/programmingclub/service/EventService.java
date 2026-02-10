package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.dto.EventDTO;
import com.itmo.programmingclub.model.entity.Event;
import com.itmo.programmingclub.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class EventService {
    private final EventRepository eventRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Event createEvent(Event event) {
        Event savedEvent = eventRepository.save(event);
        
        // Send event to WebSocket topic if it's team-related
        if (savedEvent.getTeam() != null) {
            Integer teamId = savedEvent.getTeam().getId();
            EventDTO eventDTO = EventDTO.fromEntity(savedEvent);
            
            // Send to team-specific topic
            String topic = "/topic/team/" + teamId + "/events";
            messagingTemplate.convertAndSend(topic, eventDTO);
            log.debug("Sent event {} to topic {}", savedEvent.getType(), topic);
        }
        
        return savedEvent;
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

    public List<EventDTO> findDTOsByClassId(Integer classId) {
        return eventRepository.findByClassEntityId(classId).stream()
                .map(EventDTO::fromEntity)
                .collect(Collectors.toList());
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

