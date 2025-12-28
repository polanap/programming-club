package com.itmo.programmingclub.scheduler;

import com.itmo.programmingclub.model.entity.Group;
import com.itmo.programmingclub.repository.GroupRepository;
import com.itmo.programmingclub.service.ClassService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Scheduler that runs every Sunday at 12:00 to generate classes for the next week.
 * Implements FR36: System should automatically at the beginning of the week (Sunday, 12:00)
 * form class objects for the next week.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WeeklyClassScheduler {
    private final GroupRepository groupRepository;
    private final ClassService classService;

    /**
     * Runs every Sunday at 12:00 (noon).
     * Generates classes for the next week for all started groups.
     */
    @Scheduled(cron = "0 0 12 * * SUN")
    @Transactional
    public void generateClassesForNextWeek() {
        log.info("Starting weekly class generation for next week");
        
        // Get all started groups
        List<Group> startedGroups = groupRepository.findAll().stream()
                .filter(Group::isStarted)
                .toList();
        
        if (startedGroups.isEmpty()) {
            log.info("No started groups found, skipping class generation");
            return;
        }
        
        log.info("Found {} started groups, generating classes for next week", startedGroups.size());
        
        int successCount = 0;
        int errorCount = 0;
        
        for (Group group : startedGroups) {
            try {
                classService.generateClassesForNextWeek(group);
                successCount++;
            } catch (Exception e) {
                log.error("Error generating classes for group {}: {}", group.getId(), e.getMessage(), e);
                errorCount++;
            }
        }
        
        log.info("Completed weekly class generation: {} successful, {} errors", successCount, errorCount);
    }
}

