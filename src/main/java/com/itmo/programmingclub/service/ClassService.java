package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassService {
    private final ClassRepository classRepository;

    public Class createClass(Class classEntity) {
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

    public Class updateClass(Class classEntity) {
        return classRepository.save(classEntity);
    }

    public void deleteClass(Integer id) {
        classRepository.deleteById(id);
    }
}

