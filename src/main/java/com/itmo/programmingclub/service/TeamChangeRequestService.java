package com.itmo.programmingclub.service;

import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.dto.TeamChangeRequestDTO;
import com.itmo.programmingclub.model.dto.TeamChangeRequestResponseDTO;
import com.itmo.programmingclub.model.dto.UserRoleDTO;
import com.itmo.programmingclub.model.entity.*;
import com.itmo.programmingclub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TeamChangeRequestService {
    private final TeamChangeRequestRepository teamChangeRequestRepository;
    private final TeamRepository teamRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserTeamRepository userTeamRepository;
    private final UserRepository userRepository;
    private final ElderChangeRequestService elderChangeRequestService;

    private final ZoneId zoneId;

    @Scheduled(fixedRateString = "${app.schedule.check-rate}")
    public void closeExpiredRequests() {
        log.info("Scheduler: Checking for expired TeamChangeRequests...");

        List<TeamChangeRequest> activeRequests = teamChangeRequestRepository.findByStatus(TeamChangeRequest.RequestStatus.NEW);

        ZonedDateTime now = ZonedDateTime.now(zoneId);

        for (TeamChangeRequest req : activeRequests) {
            Schedule schedule = req.getFromTeam().getClassEntity().getSchedule();

            if (isClassStarted(schedule, now)) {
                log.info("Request {} expired. Class started at {}", req.getId(), schedule.getClassStartTime());

                req.setStatus(TeamChangeRequest.RequestStatus.REJECTED);
                req.setClosingTime(OffsetDateTime.now());

                teamChangeRequestRepository.save(req);
            }
        }
    }

    public void createTeamChangeRequest(String username, TeamChangeRequestDTO dto) {
        UserRole studentRole = getUserRole(username, "STUDENT");

        UserTeam currentMembership = userTeamRepository.findTopByUserRole_IdOrderByTeam_IdDesc(studentRole.getId())
                .orElseThrow(() -> new IllegalArgumentException("Student is not assigned to any team"));

        Team fromTeam = currentMembership.getTeam();

        validateRequestTime(fromTeam.getClassEntity().getSchedule());

        Team toTeam = teamRepository.findById(dto.getToTeamId())
                .orElseThrow(() -> new NotFoundException("Target team not found"));

        if (fromTeam.getId().equals(toTeam.getId())) {
            throw new IllegalArgumentException("You are already in this team");
        }

        if (!fromTeam.getClassEntity().getId().equals(toTeam.getClassEntity().getId())) {
            throw new IllegalArgumentException("Cannot switch to a team in a different class");
        }

        TeamChangeRequest request = TeamChangeRequest.builder()
                .student(studentRole)
                .fromTeam(fromTeam)
                .toTeam(toTeam)
                .comment(dto.getComment())
                .status(TeamChangeRequest.RequestStatus.NEW)
                .build();

        teamChangeRequestRepository.save(request);
    }

    public void processTeamChangeRequest(Integer requestId, String curatorUsername, boolean approved) {
        TeamChangeRequest request = teamChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Request not found"));

        if (request.getStatus() != TeamChangeRequest.RequestStatus.NEW) {
            throw new IllegalStateException("Request is already processed");
        }

        UserRole curatorRole = getUserRole(curatorUsername, "CURATOR");

        request.setStatus(approved ? TeamChangeRequest.RequestStatus.APPROVED : TeamChangeRequest.RequestStatus.REJECTED);
        request.setCurator(curatorRole);
        request.setClosingTime(OffsetDateTime.now());
        teamChangeRequestRepository.save(request);

        if (approved) {
            executeTransfer(request.getStudent(), request.getFromTeam(), request.getToTeam());
        }
    }

    private void executeTransfer(UserRole studentRole, Team fromTeam, Team toTeam) {
        UserTeam.UserTeamId oldId = new UserTeam.UserTeamId(studentRole.getId(), fromTeam.getId());
        if (userTeamRepository.existsById(oldId)) {
            userTeamRepository.deleteById(oldId);
        }

        // Отклоняем реквесты, когда студент перешёл в другую группу
        elderChangeRequestService.cancelRequestsForStudent(studentRole.getId());

        UserTeam newMembership = new UserTeam();
        newMembership.setId(new UserTeam.UserTeamId(studentRole.getId(), toTeam.getId()));
        newMembership.setUserRole(studentRole);
        newMembership.setTeam(toTeam);

        userTeamRepository.save(newMembership);

        if (fromTeam.getElder() != null && fromTeam.getElder().getId().equals(studentRole.getUser().getId())) {
            var remainingMembers = userTeamRepository.findByTeamId(fromTeam.getId());
            if (!remainingMembers.isEmpty()) {
                fromTeam.setElder(remainingMembers.get(0).getUserRole().getUser());
                teamRepository.save(fromTeam);
            }
        }
    }

    private UserRole getUserRole(String username, String requiredRoleName) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        return userRoleRepository.findByUserId(user.getId()).stream()
                .filter(ur -> ur.getRole().getRole().name().equalsIgnoreCase(requiredRoleName))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("User " + username + " does not have role " + requiredRoleName));
    }

    private boolean isClassStarted(Schedule schedule, ZonedDateTime now) {
        if (schedule.getDayOfWeek().name().equals(now.getDayOfWeek().name())) {
            return !now.toLocalTime().isBefore(schedule.getClassStartTime());
        }
        return false;
    }

    private void validateRequestTime(Schedule schedule) {
        if (isClassStarted(schedule, ZonedDateTime.now(zoneId))) {
            throw new IllegalArgumentException("Cannot change team: The class has already started.");
        }
    }

    public Optional<TeamChangeRequestResponseDTO> findById(Integer id) {
        return teamChangeRequestRepository.findById(id)
                .map(this::toDTO);
    }

    public List<TeamChangeRequestResponseDTO> findAll() {
        return teamChangeRequestRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TeamChangeRequestResponseDTO> findByStudentId(Integer studentId) {
        return teamChangeRequestRepository.findByStudentId(studentId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TeamChangeRequestResponseDTO> findByStatus(TeamChangeRequest.RequestStatus status) {
        return teamChangeRequestRepository.findByStatus(status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private TeamChangeRequestResponseDTO toDTO(TeamChangeRequest request) {
        if (request == null) {
            return null;
        }

        UserRole student = request.getStudent();
        UserRole curator = request.getCurator();
        Team fromTeam = request.getFromTeam();
        Team toTeam = request.getToTeam();

        return TeamChangeRequestResponseDTO.builder()
                .id(request.getId())
                .student(toUserRoleDTO(student))
                .curator(curator != null ? toUserRoleDTO(curator) : null)
                .comment(request.getComment())
                .status(request.getStatus())
                .creationTime(request.getCreationTime())
                .closingTime(request.getClosingTime())
                .fromTeam(fromTeam != null ? TeamChangeRequestResponseDTO.TeamRef.builder()
                        .id(fromTeam.getId())
                        .build() : null)
                .toTeam(toTeam != null ? TeamChangeRequestResponseDTO.TeamRef.builder()
                        .id(toTeam.getId())
                        .build() : null)
                .build();
    }

    private UserRoleDTO toUserRoleDTO(UserRole userRole) {
        if (userRole == null) {
            return null;
        }

        return UserRoleDTO.builder()
                .id(userRole.getId())
                .user(UserRoleDTO.UserDTO.builder()
                        .id(userRole.getUser().getId())
                        .username(userRole.getUser().getUsername())
                        .fullName(userRole.getUser().getFullName())
                        .email(userRole.getUser().getEmail())
                        .build())
                .role(UserRoleDTO.RoleDTO.builder()
                        .id(userRole.getRole().getId())
                        .role(userRole.getRole().getRole())
                        .build())
                .build();
    }

}

