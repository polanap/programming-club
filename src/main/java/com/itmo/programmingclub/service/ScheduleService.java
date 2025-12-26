package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.entity.Schedule;
import com.itmo.programmingclub.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;

    public Schedule createSchedule(Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    public Optional<Schedule> findById(Integer id) {
        return scheduleRepository.findById(id);
    }

    public List<Schedule> findAll() {
        return scheduleRepository.findAll();
    }

    public List<Schedule> findByGroupId(Integer groupId) {
        return scheduleRepository.findByGroupId(groupId);
    }

    public List<Schedule> findRelevantByGroupId(Integer groupId) {
        return scheduleRepository.findByGroupIdAndIsRelevantTrue(groupId);
    }

    public Schedule updateSchedule(Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    public void deleteSchedule(Integer id) {
        scheduleRepository.deleteById(id);
    }
}

