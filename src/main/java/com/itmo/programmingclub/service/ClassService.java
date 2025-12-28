package com.itmo.programmingclub.service;

import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.DayOfWeek;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.dto.ClassRequestDTO;
import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.model.entity.Group;
import com.itmo.programmingclub.model.entity.Schedule;
import com.itmo.programmingclub.repository.ClassRepository;
import com.itmo.programmingclub.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClassService {
    private final ClassRepository classRepository;
    private final ScheduleRepository scheduleRepository;
    private final TeamDistributionService teamDistributionService;

    public Class createClass(ClassRequestDTO dto) {
        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new NotFoundException("Schedule not found"));

        // Use provided date or default to today
        LocalDate classDate = dto.getClassDate() != null ? dto.getClassDate() : LocalDate.now();
        
        // Check if class already exists for this schedule and date
        if (classRepository.existsByScheduleIdAndClassDate(schedule.getId(), classDate)) {
            throw new IllegalArgumentException(
                String.format("Class already exists for schedule %d on date %s", schedule.getId(), classDate)
            );
        }

        Class classEntity = new Class();
        classEntity.setSchedule(schedule);
        classEntity.setClassDate(classDate);

        Class savedClass = classRepository.save(classEntity);
        teamDistributionService.generateTeamsForClass(savedClass);

        return savedClass;
    }

    public Optional<Class> findById(Integer id) {
        return classRepository.findById(id);
    }

    public Optional<Class> findByIdWithTasks(Integer id) {
        return classRepository.findByIdWithTasks(id);
    }

    public List<Class> findAll() {
        return classRepository.findAll();
    }

    public List<Class> findByScheduleId(Integer scheduleId) {
        return classRepository.findByScheduleId(scheduleId);
    }

    public List<Class> findByGroupId(Integer groupId) {
        return classRepository.findByGroupId(groupId);
    }

    public List<Class> findByCuratorId(Integer curatorId) {
        return classRepository.findByCuratorId(curatorId, RoleEnum.CURATOR);
    }

    public Class updateClass(Integer id, ClassRequestDTO dto) {
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new NotFoundException("Schedule not found"));

        // Use provided date or keep existing date
        LocalDate classDate = dto.getClassDate() != null ? dto.getClassDate() : classEntity.getClassDate();
        
        // Check if another class already exists for this schedule and date (if date changed)
        if (!classDate.equals(classEntity.getClassDate()) && 
            classRepository.existsByScheduleIdAndClassDate(schedule.getId(), classDate)) {
            throw new IllegalArgumentException(
                String.format("Class already exists for schedule %d on date %s", schedule.getId(), classDate)
            );
        }

        classEntity.setSchedule(schedule);
        classEntity.setClassDate(classDate);
        return classRepository.save(classEntity);
    }

    public void deleteClass(Integer id) {
        classRepository.deleteById(id);
    }

    // ========== Class Generation Methods ==========

    /**
     * Generates classes for a specific week starting from the given start date.
     * Only creates classes for schedules that are relevant and for days that fall within the week.
     * 
     * @param group The group for which to generate classes
     * @param weekStartDate The start date of the week (should be a Monday)
     * @param filterByStartTime If true, only creates classes where the start time is after the group's start time
     */
    public void generateClassesForWeek(Group group, LocalDate weekStartDate, boolean filterByStartTime) {
        List<Schedule> schedules = scheduleRepository.findByGroupIdAndIsRelevantTrue(group.getId());
        
        if (schedules.isEmpty()) {
            log.debug("No relevant schedules found for group {}", group.getId());
            return;
        }

        LocalDate weekEndDate = weekStartDate.plusDays(6); // Sunday
        OffsetDateTime groupStartTime = group.getStartTime();
        
        int classesCreated = 0;
        
        for (Schedule schedule : schedules) {
            // Find the date in the week that matches the schedule's day of week
            LocalDate classDate = findDateForDayOfWeek(weekStartDate, schedule.getDayOfWeek());
            
            if (classDate == null || classDate.isAfter(weekEndDate)) {
                continue;
            }
            
            // If filtering by start time, check if the class start time is after group start time
            if (filterByStartTime && groupStartTime != null) {
                ZoneOffset zoneOffset = ZoneId.systemDefault().getRules().getOffset(java.time.Instant.now());
                OffsetDateTime classDateTime = OffsetDateTime.of(
                    classDate,
                    schedule.getClassStartTime(),
                    zoneOffset
                );
                
                // Only create if class time is after group start time
                if (!classDateTime.isAfter(groupStartTime)) {
                    log.debug("Skipping class for schedule {} on {} - start time {} is not after group start time {}",
                        schedule.getId(), classDate, classDateTime, groupStartTime);
                    continue;
                }
            }
            
            // Check if class already exists
            if (classRepository.existsByScheduleIdAndClassDate(schedule.getId(), classDate)) {
                log.debug("Class already exists for schedule {} on date {}", schedule.getId(), classDate);
                continue;
            }
            
            // Create the class
            Class classEntity = new Class();
            classEntity.setSchedule(schedule);
            classEntity.setClassDate(classDate);
            classRepository.save(classEntity);
            classesCreated++;
            
            log.debug("Created class for schedule {} on date {}", schedule.getId(), classDate);
        }
        
        log.info("Generated {} classes for group {} for week starting {}", classesCreated, group.getId(), weekStartDate);
    }

    /**
     * Generates classes for the next week (starting from next Monday).
     * Used by the weekly scheduler.
     * 
     * @param group The group for which to generate classes
     */
    public void generateClassesForNextWeek(Group group) {
        LocalDate nextMonday = getNextMonday();
        generateClassesForWeek(group, nextMonday, false);
    }

    /**
     * Generates classes for the current week starting from the given start time.
     * Only creates classes where the start time is after the group start time.
     * Used when a group is started.
     * 
     * @param group The group that was just started
     */
    public void generateClassesForCurrentWeek(Group group) {
        LocalDate currentWeekStart = getCurrentWeekStart();
        generateClassesForWeek(group, currentWeekStart, true);
    }

    /**
     * Finds the date in the week starting from weekStart that matches the given day of week.
     * 
     * @param weekStart The start of the week (should be Monday)
     * @param dayOfWeek The day of week to find
     * @return The date matching the day of week, or null if not found in the week
     */
    private LocalDate findDateForDayOfWeek(LocalDate weekStart, DayOfWeek dayOfWeek) {
        // weekStart should be Monday (day 1)
        int targetDay = dayOfWeekToInt(dayOfWeek);
        int weekStartDay = weekStart.getDayOfWeek().getValue(); // 1 = Monday, 7 = Sunday
        
        if (weekStartDay != 1) {
            log.warn("Week start date {} is not a Monday, adjusting", weekStart);
            weekStart = weekStart.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        }
        
        int daysToAdd = targetDay - 1; // Monday is day 1, so we subtract 1
        return weekStart.plusDays(daysToAdd);
    }

    /**
     * Converts DayOfWeek enum to integer (1 = Monday, 7 = Sunday).
     */
    private int dayOfWeekToInt(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> 1;
            case TUESDAY -> 2;
            case WEDNESDAY -> 3;
            case THURSDAY -> 4;
            case FRIDAY -> 5;
            case SATURDAY -> 6;
            case SUNDAY -> 7;
        };
    }

    /**
     * Gets the start of the current week (Monday).
     */
    private LocalDate getCurrentWeekStart() {
        LocalDate today = LocalDate.now();
        return today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
    }

    /**
     * Gets the start of next week (next Monday).
     */
    private LocalDate getNextMonday() {
        LocalDate today = LocalDate.now();
        LocalDate nextMonday = today.with(TemporalAdjusters.next(java.time.DayOfWeek.MONDAY));
        // If today is Monday, we want the next Monday (next week)
        if (today.getDayOfWeek() == java.time.DayOfWeek.MONDAY) {
            return today.plusWeeks(1);
        }
        return nextMonday;
    }
}

