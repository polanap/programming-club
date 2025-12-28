package com.itmo.programmingclub.controller;

import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.Group;
import com.itmo.programmingclub.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;

    @GetMapping("/list")
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
}

