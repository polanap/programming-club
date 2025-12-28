package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.dto.ClassRequestDTO;
import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.model.entity.Schedule;
import com.itmo.programmingclub.repository.ClassRepository;
import com.itmo.programmingclub.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassService {
    private final ClassRepository classRepository;
    private final ScheduleRepository scheduleRepository;

    public Class createClass(ClassRequestDTO dto) {
        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new NoSuchElementException("Schedule not found"));

        Class classEntity = new Class();
        classEntity.setSchedule(schedule);

        return classRepository.save(classEntity);
    }

    public Optional<Class> findById(Integer id) {
        return classRepository.findById(id);
    }

    public List<Class> findAll() {
        return classRepository.findAll();
    }

    public List<Class> findByScheduleId(Integer scheduleId) {
        return classRepository.findByScheduleId(scheduleId);
    }

    public Class updateClass(Integer id, ClassRequestDTO dto) {
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Class not found"));

        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new NoSuchElementException("Schedule not found"));

        classEntity.setSchedule(schedule);
        return classRepository.save(classEntity);
    }

    public void deleteClass(Integer id) {
        classRepository.deleteById(id);
    }
}

