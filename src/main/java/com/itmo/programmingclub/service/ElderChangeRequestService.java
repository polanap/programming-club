package com.itmo.programmingclub.service;

import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.dto.ElderChangeRequestDTO;
import com.itmo.programmingclub.model.entity.*;
import com.itmo.programmingclub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ElderChangeRequestService {
    private final ElderChangeRequestRepository elderChangeRequestRepository;
    private final UserTeamRepository userTeamRepository;
    private final UserRoleRepository userRoleRepository;
    private final TeamRepository teamRepository;

    private final ZoneId zoneId;

    public void cancelRequestsForStudent(Integer studentId) {
        List<ElderChangeRequest> activeRequests = elderChangeRequestRepository.findByStudentId(studentId).stream()
                .filter(r -> r.getStatus() == ElderChangeRequest.RequestStatus.NEW)
                .toList();

        for (ElderChangeRequest req : activeRequests) {
            req.setStatus(ElderChangeRequest.RequestStatus.REJECTED);
            req.setClosingTime(OffsetDateTime.now());
            elderChangeRequestRepository.save(req);
        }
    }

    public void createElderChangeRequest(String username, ElderChangeRequestDTO dto) {
        UserRole student = userRoleRepository.findByUser_UsernameAndRole_Role(username, RoleEnum.STUDENT)
                .orElseThrow(() -> new AccessDeniedException("User " + username + " does not have role STUDENT"));

        UserTeam currentMembership = userTeamRepository.findTopByUserRole_IdOrderByTeam_IdDesc(student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Student is not assigned to any team"));
        Team team = currentMembership.getTeam();

        validateRequestTime(team.getClassEntity().getSchedule());

        UserRole newElder = userRoleRepository.findById(dto.getNewElderId())
                .orElseThrow(() -> new NotFoundException("New elder not found"));

        boolean isNewElderInTeam = userTeamRepository.findByTeamId(team.getId()).stream()
                .anyMatch(ut -> ut.getUserRole().getId().equals(newElder.getId()));

        if (!isNewElderInTeam) {
            throw new IllegalArgumentException("New elder must be in the same team");
        }

        List<ElderChangeRequest> oldRequests = elderChangeRequestRepository.findByStudentId(student.getId()).stream()
                .filter(r -> r.getStatus() == ElderChangeRequest.RequestStatus.NEW)
                .toList();

        for (ElderChangeRequest oldReq : oldRequests) {
            oldReq.setStatus(ElderChangeRequest.RequestStatus.REJECTED);
            oldReq.setClosingTime(OffsetDateTime.now());
            elderChangeRequestRepository.save(oldReq);
        }
        ElderChangeRequest request = ElderChangeRequest.builder()
                .student(student)
                .newElder(newElder)
                .status(ElderChangeRequest.RequestStatus.NEW)
                .comment(dto.getComment())
                .build();

        elderChangeRequestRepository.save(request);

        checkAndApplyElderChange(team, newElder);
    }

    private void checkAndApplyElderChange(Team team, UserRole candidate) {
        // Получаем всех членов команды
        List<UserRole> members = userTeamRepository.findByTeamId(team.getId()).stream()
                .map(UserTeam::getUserRole)
                .toList();

        int teamSize = members.size();
        if (teamSize == 0) return;

        // Считаем количество голосов за этого кандидата от членов этой команды
        long votes = elderChangeRequestRepository.findByStatus(ElderChangeRequest.RequestStatus.NEW).stream()
                .filter(req -> req.getNewElder().getId().equals(candidate.getId())) // Голос за кандидата
                .filter(req -> members.stream().anyMatch(m -> m.getId().equals(req.getStudent().getId()))) // Голос от члена команды
                .count();

        // Если все проголосовали ЗА
        if (votes == teamSize) {
            // Назначаем нового старосту
            team.setElder(candidate.getUser());
            teamRepository.save(team);

            // Закрываем все заявки этой команды
            List<ElderChangeRequest> allTeamRequests = elderChangeRequestRepository.findByStatus(ElderChangeRequest.RequestStatus.NEW).stream()
                    .filter(req -> members.stream().anyMatch(m -> m.getId().equals(req.getStudent().getId())))
                    .toList();

            allTeamRequests.forEach(req -> {
                req.setStatus(ElderChangeRequest.RequestStatus.APPROVED);
                req.setClosingTime(OffsetDateTime.now());
                elderChangeRequestRepository.save(req);
            });
        }
    }

    private boolean isClassStarted(Schedule schedule, ZonedDateTime now) {
        if (schedule.getDayOfWeek().name().equals(now.getDayOfWeek().name())) {
            return !now.toLocalTime().isBefore(schedule.getClassStartTime());
        }
        return false;
    }

    private void validateRequestTime(Schedule schedule) {
        if (isClassStarted(schedule, ZonedDateTime.now(zoneId))) {
            throw new IllegalArgumentException("Cannot change elder: The class has already started.");
        }
    }

    public Optional<ElderChangeRequest> findById(Integer id) {
        return elderChangeRequestRepository.findById(id);
    }

    public List<ElderChangeRequest> findAll() {
        return elderChangeRequestRepository.findAll();
    }

    public List<ElderChangeRequest> findByStudentId(Integer studentId) {
        return elderChangeRequestRepository.findByStudentId(studentId);
    }

    public List<ElderChangeRequest> findByStatus(ElderChangeRequest.RequestStatus status) {
        return elderChangeRequestRepository.findByStatus(status);
    }

    public ElderChangeRequest updateElderChangeRequest(ElderChangeRequest request) {
        return elderChangeRequestRepository.save(request);
    }
}

