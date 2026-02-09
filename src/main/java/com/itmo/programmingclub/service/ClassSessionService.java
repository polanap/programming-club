package com.itmo.programmingclub.service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import com.itmo.programmingclub.model.dto.SubmissionDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.entity.Class;
import com.itmo.programmingclub.model.entity.Event;
import com.itmo.programmingclub.model.entity.Submission;
import com.itmo.programmingclub.model.entity.Task;
import com.itmo.programmingclub.model.entity.Team;
import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.model.entity.UserRole;
import com.itmo.programmingclub.model.entity.UserTeam;
import com.itmo.programmingclub.repository.ClassRepository;
import com.itmo.programmingclub.repository.EventRepository;
import com.itmo.programmingclub.repository.TaskRepository;
import com.itmo.programmingclub.repository.TeamRepository;
import com.itmo.programmingclub.repository.UserRepository;
import com.itmo.programmingclub.repository.UserRoleRepository;
import com.itmo.programmingclub.repository.UserTeamRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClassSessionService {
    private final ClassService classService;
    private final EventService eventService;
    private final ClassRepository classRepository;
    private final EventRepository eventRepository;
    private final UserRoleRepository userRoleRepository;
    private final TeamRepository teamRepository;
    private final UserTeamRepository userTeamRepository;
    private final UserRepository userRepository;
    private final SubmissionService submissionService;
    private final TaskRepository taskRepository;

    /**
     * Joins a student to a class session.
     * Creates an event for student joining.
     */
    public void joinClassAsStudent(Integer classId, String username) {
        Class classEntity = classService.getClassAndValidateInSession(classId);
        
        UserRole studentRole = getUserRole(username, RoleEnum.STUDENT);
        
        // Check if student is in a team for this class
        Optional<UserTeam> userTeamOpt = userTeamRepository.findByUserRoleId(studentRole.getId()).stream()
                .filter(ut -> ut.getTeam().getClassEntity().getId().equals(classId))
                .findFirst();
        
        if (userTeamOpt.isEmpty()) {
            throw new IllegalArgumentException("Student is not assigned to any team in this class");
        }
        
        // Create join event
        Event event = new Event();
        event.setType(Event.EventType.STUDENT_JOINED_CLASS);
        event.setClassEntity(classEntity);
        event.setUserRole(studentRole);
        eventService.createEvent(event);
        
        log.info("Student {} joined class {}", username, classId);
    }

    /**
     * Leaves a class session as a student.
     * Creates an event for student leaving.
     * Note: No session validation - user can leave even after class ends.
     */
    public void leaveClassAsStudent(Integer classId, String username) {
        Class classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));
        
        UserRole studentRole = getUserRole(username, RoleEnum.STUDENT);
        
        // Create leave event
        Event event = new Event();
        event.setType(Event.EventType.STUDENT_LEFT_CLASS);
        event.setClassEntity(classEntity);
        event.setUserRole(studentRole);
        eventService.createEvent(event);
        
        log.info("Student {} left class {}", username, classId);
    }

    /**
     * Joins a curator to a class session.
     * Creates an event for curator joining.
     */
    public void joinClassAsCurator(Integer classId, String username) {
        Class classEntity = classService.getClassAndValidateInSession(classId);
        
        UserRole curatorRole = getUserRole(username, RoleEnum.CURATOR);
        
        // Create join event
        Event event = new Event();
        event.setType(Event.EventType.CURATOR_JOINED_CLASS);
        event.setClassEntity(classEntity);
        event.setUserRole(curatorRole);
        eventService.createEvent(event);
        
        log.info("Curator {} joined class {}", username, classId);
    }

    /**
     * Leaves a class session as a curator.
     * Creates an event for curator leaving.
     * Note: No session validation - user can leave even after class ends.
     */
    public void leaveClassAsCurator(Integer classId, String username) {
        Class classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));
        
        UserRole curatorRole = getUserRole(username, RoleEnum.CURATOR);
        
        // Create leave event
        Event event = new Event();
        event.setType(Event.EventType.CURATOR_LEFT_CLASS);
        event.setClassEntity(classEntity);
        event.setUserRole(curatorRole);
        eventService.createEvent(event);
        
        log.info("Curator {} left class {}", username, classId);
    }

    /**
     * Joins a curator to a team.
     * Creates an event for curator joining the team.
     */
    public void joinTeamAsCurator(Integer teamId, String username) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        
        Class classEntity = team.getClassEntity();
        classService.validateClassInSession(classEntity);
        
        UserRole curatorRole = getUserRole(username, RoleEnum.CURATOR);
        
        // Create join event
        Event event = new Event();
        event.setType(Event.EventType.CURATOR_JOINED_TEAM);
        event.setClassEntity(classEntity);
        event.setTeam(team);
        event.setUserRole(curatorRole);
        eventService.createEvent(event);
        
        log.info("Curator {} joined team {}", username, teamId);
    }

    /**
     * Leaves a team as a curator.
     * Creates an event for curator leaving the team.
     */
    public void leaveTeamAsCurator(Integer teamId, String username) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        
        Class classEntity = team.getClassEntity();
        classService.validateClassInSession(classEntity);
        
        UserRole curatorRole = getUserRole(username, RoleEnum.CURATOR);
        
        // Create leave event
        Event event = new Event();
        event.setType(Event.EventType.CURATOR_LEFT_TEAM);
        event.setClassEntity(classEntity);
        event.setTeam(team);
        event.setUserRole(curatorRole);
        eventService.createEvent(event);
        
        log.info("Curator {} left team {}", username, teamId);
    }

    /**
     * Blocks or unblocks a team from sending task submissions.
     * Creates an event instead of modifying the entity field.
     */
    public void setTeamSubmissionBlocked(Integer teamId, boolean blocked, String username) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        
        Class classEntity = team.getClassEntity();
        classService.validateClassInSession(classEntity);
        
        // Verify user is a curator
        UserRole curatorRole = getUserRole(username, RoleEnum.CURATOR);
        
        // Create event for blocking/unblocking
        Event event = new Event();
        event.setType(blocked ? Event.EventType.CURATOR_BLOCKED_TEAM : Event.EventType.CURATOR_UNBLOCKED_TEAM);
        event.setClassEntity(classEntity);
        event.setTeam(team);
        event.setUserRole(curatorRole);
        eventService.createEvent(event);
        
        log.info("Team {} submission blocked status set to {} by curator {}", teamId, blocked, username);
    }

    /**
     * Raises or lowers hand for a team (by elder).
     * Creates an event for hand raise/lower.
     */
    public void toggleHandRaised(Integer teamId, String username) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        
        Class classEntity = team.getClassEntity();
        classService.validateClassInSession(classEntity);
        
        // Verify user is the elder of the team
        UserRole studentRole = getUserRole(username, RoleEnum.STUDENT);
        if (!team.getElder().getId().equals(studentRole.getUser().getId())) {
            throw new IllegalArgumentException("Only the team elder can raise/lower hand");
        }
        
        // Check current hand status
        boolean currentlyRaised = isHandRaised(teamId);
        boolean newRaised = !currentlyRaised;
        
        // Create event for hand raise/lower
        Event event = new Event();
        event.setType(newRaised ? Event.EventType.TEAM_RAISED_HAND : Event.EventType.TEAM_LOWERED_HAND);
        event.setClassEntity(classEntity);
        event.setTeam(team);
        event.setUserRole(studentRole);
        eventService.createEvent(event);
        
        log.info("Team {} hand {} by elder {}", teamId, newRaised ? "raised" : "lowered", username);
    }

    /**
     * Selects a task for a team (by elder).
     * Creates an event for task selection.
     */
    public void selectTaskForTeam(Integer teamId, Integer taskId, String username) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        
        Class classEntity = team.getClassEntity();
        classService.validateClassInSession(classEntity);
        
        // Verify user is the elder of this team
        UserRole studentRole = getUserRole(username, RoleEnum.STUDENT);
        if (!team.getElder().getId().equals(studentRole.getUser().getId())) {
            throw new IllegalArgumentException("Only the team elder can select tasks");
        }
        
        // Verify task is assigned to this class
        boolean taskAssigned = classEntity.getTasks().stream()
                .anyMatch(t -> t.getId().equals(taskId));
        if (!taskAssigned) {
            throw new IllegalArgumentException("Task is not assigned to this class");
        }
        
        // Create task selection event
        Event event = new Event();
        event.setType(Event.EventType.TEAM_BEGAN_TO_COMPLETE_TASK);
        event.setClassEntity(classEntity);
        event.setTeam(team);
        event.setTask(team.getClassEntity().getTasks().stream()
                .filter(t -> t.getId().equals(taskId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Task not found")));
        event.setUserRole(studentRole);
        eventService.createEvent(event);
        
        log.info("Team {} selected task {} by elder {}", teamId, taskId, username);
    }

    /**
     * Submits a solution for a task (by elder).
     * Creates an event for submission.
     * Note: The actual testing logic should be handled separately and create RESULT_OF_SOLUTION event.
     */
    public Submission submitSolution(Integer teamId, Integer taskId, String solution, String username) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        
        Class classEntity = team.getClassEntity();
        classService.validateClassInSession(classEntity);
        
        // Check if team is blocked from submitting (based on events)
        if (isTeamBlocked(teamId)) {
            throw new IllegalArgumentException("Команда заблокирована для отправки решений");
        }
        
        // Verify user is the elder of this team
        UserRole studentRole = getUserRole(username, RoleEnum.STUDENT);
        if (!team.getElder().getId().equals(studentRole.getUser().getId())) {
            throw new IllegalArgumentException("Только староста команды может отправлять решения");
        }
        
        // Verify task is assigned to this class
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
        
        boolean taskAssigned = classEntity.getTasks().stream()
                .anyMatch(t -> t.getId().equals(taskId));
        if (!taskAssigned) {
            throw new IllegalArgumentException("Задача не привязана к этому занятию");
        }
        
        // Create submission (completion time would need to be calculated based on when task was selected)
        // For now, we'll use a placeholder duration
        Submission submission = new Submission();
        submission.setTeam(team);
        submission.setTask(task);
        submission.setStatus(Submission.SubmissionStatus.NEW);
        submission.setComplitionTime(java.time.Duration.ofMinutes(0)); // Should be calculated properly
        
        Submission savedSubmission = submissionService.createSubmission(submission);
        
        // Create submission event
        Event event = new Event();
        event.setType(Event.EventType.TEAM_SENT_SOLUTION);
        event.setClassEntity(classEntity);
        event.setTeam(team);
        event.setTask(task);
        event.setSubmission(savedSubmission);
        event.setUserRole(studentRole);
        eventService.createEvent(event);
        
        log.info("Team {} submitted solution for task {} by elder {}", teamId, taskId, username);
        
        return savedSubmission;
    }

    public SubmissionDTO getSubmissionDetails(Integer submissionId) {
        Submission submission = submissionService.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        return SubmissionDTO.fromEntity(submission);
    }

    /**
     * Checks if a team is blocked from submitting solutions based on events.
     */
    public boolean isTeamBlocked(Integer teamId) {
        // Get the most recent blocking/unblocking event from DB
        Optional<Event> lastBlockEvent = eventRepository.findTopByTeamIdAndTypeInOrderByTimeDesc(
                teamId,
                Arrays.asList(Event.EventType.CURATOR_BLOCKED_TEAM, Event.EventType.CURATOR_UNBLOCKED_TEAM)
        );
        
        // If last event is BLOCKED, team is blocked; otherwise not blocked
        return lastBlockEvent.isPresent() && lastBlockEvent.get().getType() == Event.EventType.CURATOR_BLOCKED_TEAM;
    }

    /**
     * Checks if a team's hand is currently raised based on events.
     */
    public boolean isHandRaised(Integer teamId) {
        // Get the most recent hand raise/lower event from DB
        Optional<Event> lastHandEvent = eventRepository.findTopByTeamIdAndTypeInOrderByTimeDesc(
                teamId,
                Arrays.asList(Event.EventType.TEAM_RAISED_HAND, Event.EventType.TEAM_LOWERED_HAND)
        );
        
        // If last event is RAISED, hand is raised; otherwise not raised
        return lastHandEvent.isPresent() && lastHandEvent.get().getType() == Event.EventType.TEAM_RAISED_HAND;
    }

    /**
     * Checks if a curator is currently joined to a team based on events.
     */
    public boolean isCuratorJoinedToTeam(Integer teamId, Integer curatorUserRoleId) {
        // Get the most recent join/leave event for this curator from DB
        Optional<Event> lastJoinEvent = eventRepository.findTopByTeamIdAndUserRoleIdAndTypeInOrderByTimeDesc(
                teamId,
                curatorUserRoleId,
                Arrays.asList(Event.EventType.CURATOR_JOINED_TEAM, Event.EventType.CURATOR_LEFT_TEAM)
        );
        
        // If last event is JOINED, curator is joined; otherwise not joined
        return lastJoinEvent.isPresent() && lastJoinEvent.get().getType() == Event.EventType.CURATOR_JOINED_TEAM;
    }

    /**
     * Checks if a curator (by username) is currently joined to a team based on events.
     */
    public boolean isCuratorJoinedToTeamByUsername(Integer teamId, String curatorUsername) {
        UserRole curatorRole = getUserRole(curatorUsername, RoleEnum.CURATOR);
        return isCuratorJoinedToTeam(teamId, curatorRole.getId());
    }

    /**
     * Gets list of curator UserRole IDs that are currently joined to a team based on events.
     * Uses DB-level queries to find curators whose last event is JOINED.
     */
    public List<Integer> getJoinedCuratorsToTeam(Integer teamId) {
        // Get all distinct curator IDs who have join/leave events for this team
        List<Integer> curatorIds = eventRepository.findDistinctUserRoleIdsByTeamIdAndTypeIn(
                teamId,
                Arrays.asList(Event.EventType.CURATOR_JOINED_TEAM, Event.EventType.CURATOR_LEFT_TEAM)
        );
        
        // For each curator, check their last event using DB query
        return curatorIds.stream()
                .filter(curatorId -> {
                    Optional<Event> lastEvent = eventRepository.findTopByTeamIdAndUserRoleIdAndTypeInOrderByTimeDesc(
                            teamId,
                            curatorId,
                            Arrays.asList(Event.EventType.CURATOR_JOINED_TEAM, Event.EventType.CURATOR_LEFT_TEAM)
                    );
                    return lastEvent.isPresent() && lastEvent.get().getType() == Event.EventType.CURATOR_JOINED_TEAM;
                })
                .toList();
    }

    /**
     * Gets the currently selected task for a team based on events.
     * Returns the task from the most recent TEAM_BEGAN_TO_COMPLETE_TASK event.
     */
    public Optional<Task> getSelectedTaskForTeam(Integer teamId) {
        // Get the most recent task selection event from DB
        Optional<Event> lastTaskSelection = eventRepository.findTopByTeamIdAndTypeOrderByTimeDesc(
                teamId,
                Event.EventType.TEAM_BEGAN_TO_COMPLETE_TASK
        );
        
        return lastTaskSelection
                .filter(e -> e.getTask() != null)
                .map(Event::getTask);
    }

    private UserRole getUserRole(String username, RoleEnum requiredRole) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        return userRoleRepository.findByUserId(user.getId()).stream()
                .filter(ur -> ur.getRole().getRole() == requiredRole)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        String.format("User %s does not have role %s", username, requiredRole)));
    }
}
