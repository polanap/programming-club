package com.itmo.programmingclub.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.itmo.programmingclub.exceptions.UnauthorizedException;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.dto.AddUserToGroupRequest;
import com.itmo.programmingclub.model.dto.CreateScheduleRequest;
import com.itmo.programmingclub.model.dto.GroupResponse;
import com.itmo.programmingclub.model.entity.Group;
import com.itmo.programmingclub.model.entity.Schedule;
import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.security.CustomUserDetails;
import com.itmo.programmingclub.security.SecurityUtils;
import com.itmo.programmingclub.service.GroupService;

import lombok.RequiredArgsConstructor;
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;
    private final Logger logger = LoggerFactory.getLogger(GroupController.class);
    // FR6: Create group
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Group> createGroup() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        Group group = groupService.createGroup(currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(group);
    }
    // Get group details
    @GetMapping("/{groupId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'CURATOR', 'STUDENT')")
    public ResponseEntity<GroupResponse> getGroupDetails(@PathVariable Integer groupId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        GroupResponse response = groupService.getGroupDetails(groupId, currentUser.getUserId());
        return ResponseEntity.ok(response);
    }

    // FR8: Add student to group
    @PostMapping("/{groupId}/students")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> addStudentToGroup(@PathVariable Integer groupId, @RequestBody AddUserToGroupRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        groupService.addStudentToGroup(groupId, request.getUserId(), currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR9: Remove student from group
    @DeleteMapping("/{groupId}/students/{studentUserId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removeStudentFromGroup(@PathVariable Integer groupId, @PathVariable Integer studentUserId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        groupService.removeStudentFromGroup(groupId, studentUserId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR10: Add curator to group
    @PostMapping("/{groupId}/curators")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> addCuratorToGroup(@PathVariable Integer groupId, @RequestBody AddUserToGroupRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        groupService.addCuratorToGroup(groupId, request.getUserId(), currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR11: Remove curator from group
    @DeleteMapping("/{groupId}/curators/{curatorUserId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removeCuratorFromGroup(@PathVariable Integer groupId, @PathVariable Integer curatorUserId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        groupService.removeCuratorFromGroup(groupId, curatorUserId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR12: Create schedule for group
    @PostMapping("/{groupId}/schedules")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Schedule> createSchedule(@PathVariable Integer groupId, @RequestBody CreateScheduleRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        Schedule schedule = groupService.createSchedule(
                groupId,
                request.getDayOfWeek(),
                request.getClassStartTime(), 
                request.getClassEndTime(),
                currentUser.getUserId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(schedule);
    }
    
    // Delete schedule from group
    @DeleteMapping("/{groupId}/schedules/{scheduleId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Integer groupId, @PathVariable Integer scheduleId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        groupService.deleteSchedule(groupId, scheduleId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR13: Add manager to group
    @PostMapping("/{groupId}/managers")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> addManagerToGroup(@PathVariable Integer groupId, @RequestBody AddUserToGroupRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        groupService.addManagerToGroup(groupId, request.getUserId(), currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR13: Remove manager from group
    @DeleteMapping("/{groupId}/managers/{managerUserId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removeManagerFromGroup(@PathVariable Integer groupId, @PathVariable Integer managerUserId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        groupService.removeManagerFromGroup(groupId, managerUserId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR14: Start group
    @PostMapping("/{groupId}/start")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> startGroup(@PathVariable Integer groupId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        groupService.startGroup(groupId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }
    
    // Get all groups of current manager
    @GetMapping("manager/my")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<Group>> getManagersGroups() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        logger.info("Getting groups for user: {}", currentUser.getUserId());
        List<Group> groups = groupService.findByUserIdAndRole(currentUser.getUserId(), RoleEnum.MANAGER);
        return ResponseEntity.ok(groups);
    }

        // Get all groups of current curator
    @GetMapping("curator/my")
    @PreAuthorize("hasRole('CURATOR')")
    public ResponseEntity<List<Group>> getCuratorsGroups() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        logger.info("Getting groups for user: {}", currentUser.getUserId());
        List<Group> groups = groupService.findByUserIdAndRole(currentUser.getUserId(), RoleEnum.CURATOR);
        return ResponseEntity.ok(groups);
    }

    // Get all groups of current student
    @GetMapping("student/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Group>> getStudentsGroups() {
    CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("User is not authenticated");
    }
    logger.info("Getting groups for user: {}", currentUser.getUserId());
    List<Group> groups = groupService.findByUserIdAndRole(currentUser.getUserId(), RoleEnum.STUDENT);
    return ResponseEntity.ok(groups);
}

    
    // Get users of a group by role
    @GetMapping("/{groupId}/users/{role}")
    @PreAuthorize("hasAnyRole('MANAGER', 'CURATOR', 'STUDENT')")
    public ResponseEntity<List<User>> getGroupUsersByRole(
            @PathVariable Integer groupId,
            @PathVariable String role) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        List<User> users = groupService.getGroupUsersByRole(groupId, role, currentUser.getUserId());
        return ResponseEntity.ok(users);
    }

    @GetMapping()
    public ResponseEntity<List<Group>> getAllGroups() {
        return ResponseEntity.ok(groupService.findAll());
    }

    @GetMapping("/{id}/basic")
    public ResponseEntity<Group> getGroupById(@PathVariable Integer id) {
        return ResponseEntity.ok(groupService.findById(id));
    }
    
    @GetMapping("/user/{userId}/role/{role}")
    public ResponseEntity<List<Group>> getGroupsByUserIdAndRole(
            @PathVariable Integer userId,
            @PathVariable RoleEnum role) {
        return ResponseEntity.ok(groupService.findByUserIdAndRole(userId, role));
    }

    @GetMapping("/not-member/{studentUserRoleId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<Group>> getGroupsWhereStudentNotMember(@PathVariable Integer studentUserRoleId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(groupService.findGroupsWhereStudentNotMember(studentUserRoleId));
    }
}

