package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.entity.Class;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<Class, Integer> {
    List<Class> findByScheduleId(Integer scheduleId);
}

