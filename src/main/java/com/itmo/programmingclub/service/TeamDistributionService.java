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

        // 1. Получаем всех студентов группы
        List<UserRole> allStudents = userRoleRepository.findByGroups_Id(groupId).stream()
                .filter(ur -> RoleEnum.STUDENT.equals(ur.getRole().getRole()))
                .collect(Collectors.toList());

        if (allStudents.isEmpty()) return;

        // 2. Перемешиваем список (Random)
        Collections.shuffle(allStudents);

        // 3. Алгоритм распределения
        int totalStudents = allStudents.size();
        int currentIndex = 0;

        while (currentIndex < totalStudents) {
            int remaining = totalStudents - currentIndex;
            int teamSize = 2;

            // Логика FR37: Если осталось 3 человека — это одна команда (чтобы не оставлять одиночку)
            // Если четное кол-во, разбиваем по 2. Если нечетное, последняя будет тройкой.
            if (remaining == 3) {
                teamSize = 3;
            } else if (remaining < 2) {
                // Если в группе всего 1 человек (edge case), он будет в команде один
                teamSize = 1;
            }

            // Формируем состав новой команды
            List<UserRole> teamMembers = new ArrayList<>();
            for (int i = 0; i < teamSize; i++) {
                teamMembers.add(allStudents.get(currentIndex + i));
            }

            // Создаем и сохраняем команду
            createTeam(classEntity, teamMembers);

            currentIndex += teamSize;
        }
    }

    private void createTeam(Class classEntity, List<UserRole> members) {
        // FR37: Назначаем старосту (случайного из членов команды)
        UserRole elderRole = members.get(new Random().nextInt(members.size()));

        Team team = new Team();
        team.setClassEntity(classEntity);
        team.setElder(elderRole.getUser());

        // Сначала сохраняем Team, чтобы получить ID
        team = teamRepository.save(team);

        // Теперь сохраняем привязки UserTeam
        for (UserRole member : members) {
            UserTeam userTeam = new UserTeam();
            // Составной ключ
            userTeam.setId(new UserTeam.UserTeamId(member.getId(), team.getId()));
            userTeam.setUserRole(member);
            userTeam.setTeam(team);

            userTeamRepository.save(userTeam);
        }
    }
}