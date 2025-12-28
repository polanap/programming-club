package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.Group;
import com.itmo.programmingclub.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itmo.programmingclub.exceptions.NotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupService {
    private final GroupRepository groupRepository;

    public Group findById(Integer id) {
        return groupRepository.findById(id).orElseThrow(() -> new NotFoundException("Group not found"));
    }

    public List<Group> findAll() {
        return groupRepository.findAll();
    }

    public Group updateGroup(Group group) {
        return groupRepository.save(group);
    }

    public void deleteGroup(Integer id) {
        groupRepository.deleteById(id);
    }
    
    public List<Group> findByUserIdAndRole(Integer userId, RoleEnum role) {
        return groupRepository.findByUserIdAndRole(userId, role);
    }
}

