package com.itmo.programmingclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itmo.programmingclub.model.entity.Class;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<Class, Integer> {
    List<Class> findByScheduleId(Integer scheduleId);
    
    Optional<Class> findByScheduleIdAndClassDate(Integer scheduleId, LocalDate classDate);
    
    boolean existsByScheduleIdAndClassDate(Integer scheduleId, LocalDate classDate);
}

