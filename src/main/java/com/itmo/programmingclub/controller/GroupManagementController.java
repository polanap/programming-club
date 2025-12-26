package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.exceptions.UnauthorizedException;
import com.itmo.programmingclub.model.dto.*;
import com.itmo.programmingclub.model.entity.Group;
import com.itmo.programmingclub.model.entity.Schedule;
import com.itmo.programmingclub.security.CustomUserDetails;
import com.itmo.programmingclub.security.SecurityUtils;
import com.itmo.programmingclub.service.GroupManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupManagementController {
    private final GroupManagementService groupManagementService;

    // FR6: Create group
    @PostMapping
    public ResponseEntity<Group> createGroup() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        Group group = groupManagementService.createGroup(currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(group);
    }

    // TODO:FR7: Get all users with their groups

    // Get group details
    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> getGroupDetails(@PathVariable Integer groupId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        GroupResponse response = groupManagementService.getGroupDetails(groupId, currentUser.getUserId());
        return ResponseEntity.ok(response);
    }

    // FR8: Add student to group
    @PostMapping("/{groupId}/students")
    public ResponseEntity<Void> addStudentToGroup(@PathVariable Integer groupId, @RequestBody AddUserToGroupRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        groupManagementService.addStudentToGroup(groupId, request.getUserId(), currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR9: Remove student from group
    @DeleteMapping("/{groupId}/students/{studentUserId}")
    public ResponseEntity<Void> removeStudentFromGroup(@PathVariable Integer groupId, @PathVariable Integer studentUserId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        groupManagementService.removeStudentFromGroup(groupId, studentUserId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR10: Add curator to group
    @PostMapping("/{groupId}/curators")
    public ResponseEntity<Void> addCuratorToGroup(@PathVariable Integer groupId, @RequestBody AddUserToGroupRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        groupManagementService.addCuratorToGroup(groupId, request.getUserId(), currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR11: Remove curator from group
    @DeleteMapping("/{groupId}/curators/{curatorUserId}")
    public ResponseEntity<Void> removeCuratorFromGroup(@PathVariable Integer groupId, @PathVariable Integer curatorUserId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        groupManagementService.removeCuratorFromGroup(groupId, curatorUserId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR12: Create schedule for group
    @PostMapping("/{groupId}/schedules")
    public ResponseEntity<Schedule> createSchedule(@PathVariable Integer groupId, @RequestBody CreateScheduleRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Schedule schedule = groupManagementService.createSchedule(
                groupId, 
                request.getClassStartTime(), 
                request.getClassEndTime(),
                currentUser.getUserId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(schedule);
    }

    // FR13: Add manager to group
    @PostMapping("/{groupId}/managers")
    public ResponseEntity<Void> addManagerToGroup(@PathVariable Integer groupId, @RequestBody AddUserToGroupRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        groupManagementService.addManagerToGroup(groupId, request.getUserId(), currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR13: Remove manager from group
    @DeleteMapping("/{groupId}/managers/{managerUserId}")
    public ResponseEntity<Void> removeManagerFromGroup(@PathVariable Integer groupId, @PathVariable Integer managerUserId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        groupManagementService.removeManagerFromGroup(groupId, managerUserId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }

    // FR14: Start group
    @PostMapping("/{groupId}/start")
    public ResponseEntity<Void> startGroup(@PathVariable Integer groupId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        groupManagementService.startGroup(groupId, currentUser.getUserId());
        return ResponseEntity.ok().build();
    }
}

