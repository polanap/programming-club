package com.itmo.programmingclub.service;

import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.*;
import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.repository.TeamRepository;
import com.itmo.programmingclub.repository.UserRoleRepository;
import com.itmo.programmingclub.repository.UserTeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamDistributionService {

    private final UserRoleRepository userRoleRepository;
    private final TeamRepository teamRepository;
    private final UserTeamRepository userTeamRepository;

    public void generateTeamsForClass(Class classEntity) {
        Integer groupId = classEntity.getSchedule().getGroup().getId();

        List<UserRole> allStudents = userRoleRepository.findByGroups_Id(groupId).stream()
                .filter(ur -> RoleEnum.STUDENT.equals(ur.getRole().getRole()))
                .collect(Collectors.toList());

        if (allStudents.isEmpty()) return;

        Collections.shuffle(allStudents);

        // Алгоритм распределения
        int totalStudents = allStudents.size();
        int currentIndex = 0;

        while (currentIndex < totalStudents) {
            int remaining = totalStudents - currentIndex;
            int teamSize = 2;

            if (remaining == 3) {
                teamSize = 3;
            } else if (remaining < 2) {
                teamSize = 1;
            }

            List<UserRole> teamMembers = new ArrayList<>();
            for (int i = 0; i < teamSize; i++) {
                teamMembers.add(allStudents.get(currentIndex + i));
            }

            createTeam(classEntity, teamMembers);

            currentIndex += teamSize;
        }
    }

    private void createTeam(Class classEntity, List<UserRole> members) {
        UserRole elderRole = members.get(new Random().nextInt(members.size()));

        Team team = new Team();
        team.setClassEntity(classEntity);
        team.setElder(elderRole.getUser());

        team = teamRepository.save(team);

        for (UserRole member : members) {
            UserTeam userTeam = new UserTeam();
            userTeam.setId(new UserTeam.UserTeamId(member.getId(), team.getId()));
            userTeam.setUserRole(member);
            userTeam.setTeam(team);

            userTeamRepository.save(userTeam);
        }
    }
}