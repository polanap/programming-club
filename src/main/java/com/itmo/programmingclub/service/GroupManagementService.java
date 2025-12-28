package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.dto.GroupResponse;
import com.itmo.programmingclub.model.entity.*;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.DayOfWeek;
import com.itmo.programmingclub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupManagementService {
    private final GroupRepository groupRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final ScheduleRepository scheduleRepository;
    private final RoleService roleService;
    private final UserRoleService userRoleService;
    private final GroupService groupService;

    // FR6: Create group (not started)
    public Group createGroup(Integer managerUserId) {
        Group group = new Group();
        // startTime will be set to future date in @PrePersist to indicate not started
        group = groupRepository.save(group);
        
        UserRole userRole = userRoleService.findByUserIdAndRole(managerUserId, RoleEnum.MANAGER);
        
        group.getUserRoles().add(userRole);
        group = groupRepository.save(group);
        
        return group;
    }

// FR7: Get all users with their groups
//     public List<UserWithGroupsResponse> getAllUsersWithGroups() {
//         List<UserWithGroupsResponse> results = userRepository.findAllUsersWithGroups();
//         return results;
//     }

    // Check if manager has access to group
    void checkManagerAccess(Integer groupId, Integer managerUserId) {
        Group group = groupService.findById(groupId);
        UserRole managerUserRole = userRoleService.findByUserIdAndRole(managerUserId, RoleEnum.MANAGER);

        // Check if manager is in the group
        boolean hasAccess = group.getUserRoles().contains(managerUserRole);
        
        if (!hasAccess) {
            throw new IllegalArgumentException("Manager does not have access to this group");
        }
    }

    // FR8: Assign student to group
    public void addStudentToGroup(Integer groupId, Integer studentUserId, Integer managerUserId) {
        checkManagerAccess(groupId, managerUserId);
        
        Group group = groupService.findById(groupId);
        
        UserRole userRole = userRoleService.findByUserIdAndRole(studentUserId, RoleEnum.STUDENT);
        
        if (group.getUserRoles().contains(userRole)) {
            throw new IllegalArgumentException("Student is already in this group");
        }
        
        group.getUserRoles().add(userRole);
        groupRepository.save(group);
    }

    // FR9: Remove student from group
    public void removeStudentFromGroup(Integer groupId, Integer studentUserId, Integer managerUserId) {
        checkManagerAccess(groupId, managerUserId);
        
        Group group = groupService.findById(groupId);
        
        UserRole userRole = userRoleService.findByUserIdAndRole(studentUserId, RoleEnum.STUDENT);
        
        if (!group.getUserRoles().contains(userRole)) {
                throw new IllegalArgumentException("Student is not in this group");
        }

        group.getUserRoles().remove(userRole);
        groupRepository.save(group);
    }

    // FR10: Assign curator to group
    public void addCuratorToGroup(Integer groupId, Integer curatorUserId, Integer managerUserId) {
        checkManagerAccess(groupId, managerUserId);
        
        Group group = groupService.findById(groupId);
        
        UserRole userRole = userRoleService.findByUserIdAndRole(curatorUserId, RoleEnum.CURATOR);
        
        if (group.getUserRoles().contains(userRole)) {
            throw new IllegalArgumentException("Curator is already in this group");
        }
        
        group.getUserRoles().add(userRole);
        groupRepository.save(group);
    }

    // FR11: Remove curator from group (with check for started groups)
    public void removeCuratorFromGroup(Integer groupId, Integer curatorUserId, Integer managerUserId) {
        checkManagerAccess(groupId, managerUserId);
        
        Group group = groupService.findById(groupId);
        
        UserRole userRole = userRoleService.findByUserIdAndRole(curatorUserId, RoleEnum.CURATOR);
        
        if (!group.getUserRoles().contains(userRole)) {
            throw new IllegalArgumentException("Curator is not in this group");
        }
        
        // FR11: If group is started, must have at least one curator
        if (group.isStarted()) {
            long curatorCount = group.getUserRoles().stream()
                    .filter(ur -> ur.getRole().getRole() == RoleEnum.CURATOR)
                    .count();
            if (curatorCount <= 1) {
                throw new IllegalArgumentException("Cannot remove curator: group is started and must have at least one curator");
            }
        }
        
        group.getUserRoles().remove(userRole);
        groupRepository.save(group);
    }

    // FR12: Create schedule for group
    public Schedule createSchedule(Integer groupId, DayOfWeek dayOfWeek, LocalTime classStartTime, LocalTime classEndTime, Integer managerUserId) {
        checkManagerAccess(groupId, managerUserId);
        
        Group group = groupService.findById(groupId);
        
        Schedule schedule = new Schedule();
        schedule.setDayOfWeek(dayOfWeek);
        schedule.setClassStartTime(classStartTime);
        schedule.setClassEndTime(classEndTime);
        schedule.setIsRelevant(true);
        schedule.setGroup(group);
        
        return scheduleRepository.save(schedule);
    }

    // FR13: Add manager to group
    public void addManagerToGroup(Integer groupId, Integer managerUserId, Integer currentManagerUserId) {
        checkManagerAccess(groupId, currentManagerUserId);
        
        Group group = groupService.findById(groupId);
        
        UserRole userRole = userRoleService.findByUserIdAndRole(managerUserId, RoleEnum.MANAGER);
        
        if (group.getUserRoles().contains(userRole)) {
            throw new IllegalArgumentException("Manager is already in this group");
        }
        
        group.getUserRoles().add(userRole);
        groupRepository.save(group);
    }

    //FR13: Remove manager from group
    public void removeManagerFromGroup(Integer groupId, Integer managerUserId, Integer currentManagerUserId) {
        checkManagerAccess(groupId, currentManagerUserId);
        Group group = groupService.findById(groupId);
        UserRole userRole = userRoleService.findByUserIdAndRole(managerUserId, RoleEnum.MANAGER);
        
        if (!group.getUserRoles().contains(userRole)) {
            throw new IllegalArgumentException("Manager is not in this group");
        }
        
        group.getUserRoles().remove(userRole);
        groupRepository.save(group);
    }

    // FR14: Start group (if conditions are met)
    public void startGroup(Integer groupId, Integer managerUserId) {
        checkManagerAccess(groupId, managerUserId);
        
        Group group = groupService.findById(groupId);
        
        if (group.isStarted()) {
            throw new IllegalArgumentException("Group is already started");
        }   
        
        long curatorCount = group.getUserRoles().stream()
                .filter(ur -> ur.getRole().getRole() == RoleEnum.CURATOR)
                .count();
        if (curatorCount < 1) {
            throw new IllegalArgumentException("Cannot start group: must have at least one curator");
        }
        
        List<Schedule> schedules = scheduleRepository.findByGroupIdAndIsRelevantTrue(groupId);
        if (schedules.isEmpty()) {
            throw new IllegalArgumentException("Cannot start group: must have at least one relevant schedule");
        }
        
        // Start the group by setting startTime to current time
        group.setStartTime(OffsetDateTime.now());
        groupRepository.save(group);
    }

    // Get group details
    public GroupResponse getGroupDetails(Integer groupId, Integer managerUserId) {
        checkManagerAccess(groupId, managerUserId);
        
        Group group = groupService.findById(groupId);
        
        long studentCount = group.getUserRoles().stream()
                .filter(ur -> ur.getRole().getRole() == RoleEnum.STUDENT)
                .count();
        long curatorCount = group.getUserRoles().stream()
                .filter(ur -> ur.getRole().getRole() == RoleEnum.CURATOR)
                .count();
        List<Schedule> schedules = scheduleRepository.findByGroupIdAndIsRelevantTrue(groupId);
        
        boolean canStart = studentCount >= 1 && curatorCount >= 1 && !schedules.isEmpty();
        
        return GroupResponse.builder()
                .id(group.getId())
                .startTime(group.getStartTime())
                .isStarted(group.isStarted())
                .canStart(canStart && !group.isStarted())
                .build();
    }
    
    // Get users of a group by role
    public List<com.itmo.programmingclub.model.entity.User> getGroupUsersByRole(Integer groupId, String role, Integer managerUserId) {
        checkManagerAccess(groupId, managerUserId);
        Group group = groupService.findById(groupId);
        RoleEnum roleEnum;
        try {
            roleEnum = RoleEnum.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
        
        return group.getUserRoles().stream()
                .filter(ur -> ur.getRole().getRole() == roleEnum)
                .map(ur -> ur.getUser())
                .distinct()
                .collect(java.util.stream.Collectors.toList());
    }
}

