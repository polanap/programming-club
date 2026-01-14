package com.itmo.programmingclub.service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itmo.programmingclub.exceptions.NotFoundException;
import com.itmo.programmingclub.model.RoleEnum;
import com.itmo.programmingclub.model.TransferRequestStatus;
import com.itmo.programmingclub.model.dto.AddAvailableGroupsDTO;
import com.itmo.programmingclub.model.dto.AvailableGroupDTO;
import com.itmo.programmingclub.model.dto.CreateTransferRequestDTO;
import com.itmo.programmingclub.model.dto.CuratorCommentDTO;
import com.itmo.programmingclub.model.dto.RequestClarificationDTO;
import com.itmo.programmingclub.model.dto.SelectGroupDTO;
import com.itmo.programmingclub.model.dto.TransferRequestDTO;
import com.itmo.programmingclub.model.dto.UserRoleDTO;
import com.itmo.programmingclub.model.entity.AvailableGroup;
import com.itmo.programmingclub.model.entity.Group;
import com.itmo.programmingclub.model.entity.TransferRequest;
import com.itmo.programmingclub.model.entity.UserRole;
import com.itmo.programmingclub.repository.GroupRepository;
import com.itmo.programmingclub.repository.TransferRequestRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TransferRequestService {
    private final TransferRequestRepository transferRequestRepository;
    private final UserRoleService userRoleService;
    private final GroupRepository groupRepository;
    private final GroupService groupService;

    public TransferRequestDTO createNewTransferRequest(CreateTransferRequestDTO dto, Integer userId) {
        // Get student user role
        UserRole studentUserRole = userRoleService.findByUserIdAndRole(userId, RoleEnum.STUDENT);
        
        // Get source group
        Group sourceGroup = groupService.findById(dto.getSourceGroupId());
        
        // Verify student is in the source group
        if (!sourceGroup.getUserRoles().contains(studentUserRole)) {
            throw new IllegalArgumentException("Student is not in the specified source group");
        }
        
        // Check if there is an open transfer request for this student and group
        List<TransferRequestStatus> closedStatuses = Arrays.asList(
                TransferRequestStatus.TRANSFERRED, 
                TransferRequestStatus.REJECTED);
        List<TransferRequest> openRequests = transferRequestRepository.findOpenRequestsByStudentAndGroup(
                studentUserRole.getId(), sourceGroup.getId(), closedStatuses);
        if (!openRequests.isEmpty()) {
            throw new IllegalArgumentException("There is already an open transfer request for this student and group");
        }
        
        // Create request
        TransferRequest request = new TransferRequest();
        request.setStudent(studentUserRole);
        request.setSourceGroup(sourceGroup);
        request.setReason(dto.getReason());
        request.setStatus(TransferRequestStatus.NEW);
        
        TransferRequest saved = transferRequestRepository.save(request);
        return toDTO(saved);
    }

    public TransferRequest findById(Integer id) {
        return transferRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Transfer request not found"));
    }

    public TransferRequestDTO findByIdDTO(Integer id) {
        return toDTO(findById(id));
    }

    public List<TransferRequestDTO> findAll() {
        return transferRequestRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransferRequestDTO> findByStudentId(Integer studentId) {
        return transferRequestRepository.findByStudentId(studentId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransferRequestDTO> findByManagerId(Integer managerId) {
        return transferRequestRepository.findByManagerId(managerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransferRequestDTO> findByStatus(TransferRequestStatus status) {
        return transferRequestRepository.findByStatus(status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransferRequestDTO> findUnassignedRequests() {
        return transferRequestRepository.findUnassignedRequests(TransferRequestStatus.NEW).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransferRequestDTO> findByCuratorId(Integer curatorId) {
        return transferRequestRepository.findByCuratorId(curatorId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransferRequestDTO> findCuratorRequestsForClarification(Integer curatorId) {
        return transferRequestRepository.findByStatusAndCuratorId(TransferRequestStatus.WAITING_REASONS, curatorId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TransferRequestDTO changeStatus(TransferRequestStatus newStatus, Integer requestId, Integer userId) {
        TransferRequest request = findById(requestId);
        
        // Determine user role and validate transition
        RoleEnum userRole = determineUserRoleInRequest(request, userId);
        
        // Validate status transition and user role
        validateStatusTransition(request, userId, userRole, newStatus);
        
        // Update status
        request.setStatus(newStatus);
        
        // Handle terminal states
        if (newStatus == TransferRequestStatus.TRANSFERRED || newStatus == TransferRequestStatus.REJECTED) {
            request.setClosingTime(java.time.OffsetDateTime.now());
        }
        
        TransferRequest saved = transferRequestRepository.save(request);
        return toDTO(saved);
    }

    public TransferRequestDTO takeRequest(Integer requestId, Integer managerUserId) {
        TransferRequest request = findById(requestId);
        
        if (request.getManager() != null) {
            throw new IllegalArgumentException("Request is already assigned to a manager");
        }
        
        // Validate status transition and user role
        validateStatusTransition(request, managerUserId, RoleEnum.MANAGER, TransferRequestStatus.UNDER_CONSIDERATION);
        
        UserRole managerUserRole = userRoleService.findByUserIdAndRole(managerUserId, RoleEnum.MANAGER);
        request.setManager(managerUserRole);
        request.setStatus(TransferRequestStatus.UNDER_CONSIDERATION);
        
        TransferRequest saved = transferRequestRepository.save(request);
        return toDTO(saved);
    }

    public TransferRequestDTO requestCuratorClarification(Integer requestId, RequestClarificationDTO dto, Integer managerUserId) {
        TransferRequest request = findById(requestId);
        
        // Verify manager owns this request
        if (request.getManager() == null || !request.getManager().getUser().getId().equals(managerUserId)) {
            throw new IllegalArgumentException("Manager does not own this request");
        }
        
        // Validate status transition and user role
        validateStatusTransition(request, managerUserId, RoleEnum.MANAGER, TransferRequestStatus.WAITING_REASONS);
        
        // Get the curator user role
        UserRole curator = userRoleService.findById(dto.getCuratorId());
        
        // Verify curator has CURATOR role
        if (curator.getRole().getRole() != RoleEnum.CURATOR) {
            throw new IllegalArgumentException("Selected user is not a curator");
        }
        
        // Verify curator is assigned to the source group
        Group sourceGroup = request.getSourceGroup();
        if (!sourceGroup.getUserRoles().contains(curator)) {
            throw new IllegalArgumentException("Curator is not assigned to the source group");
        }
        
        request.setCurator(curator);
        request.setStatus(TransferRequestStatus.WAITING_REASONS);
        
        TransferRequest saved = transferRequestRepository.save(request);
        return toDTO(saved);
    }

    public TransferRequestDTO addCuratorComment(Integer requestId, CuratorCommentDTO dto, Integer curatorUserId) {
        TransferRequest request = findById(requestId);
        
        // Verify curator owns this request
        if (request.getCurator() == null || !request.getCurator().getUser().getId().equals(curatorUserId)) {
            throw new IllegalArgumentException("Curator does not own this request");
        }
        
        // Validate status transition and user role
        validateStatusTransition(request, curatorUserId, RoleEnum.CURATOR, TransferRequestStatus.REASON_RECEIVED);
        
        request.setCuratorsComment(dto.getComment());
        request.setStatus(TransferRequestStatus.REASON_RECEIVED);
        
        TransferRequest saved = transferRequestRepository.save(request);
        return toDTO(saved);
    }

    public TransferRequestDTO addAvailableGroups(AddAvailableGroupsDTO dto, Integer managerUserId) {
        TransferRequest request = findById(dto.getRequestId());
        
        // Verify manager owns this request
        if (request.getManager() == null || !request.getManager().getUser().getId().equals(managerUserId)) {
            throw new IllegalArgumentException("Manager does not own this request");
        }
        
        // Validate status transition and user role
        validateStatusTransition(request, managerUserId, RoleEnum.MANAGER, TransferRequestStatus.GROUP_FOUND);
        
        // Get student user role
        UserRole studentUserRole = request.getStudent();
        
        // Add groups
        for (Integer groupId : dto.getGroupIds()) {
            Group group = groupService.findById(groupId);
            
            // Check if student is already in this group
            if (group.getUserRoles().contains(studentUserRole)) {
                throw new IllegalArgumentException("Student is already a member of group #" + groupId);
            }
            
            // Check if already added
            boolean alreadyExists = request.getAvailableGroups().stream()
                    .anyMatch(ag -> ag.getGroup().getId().equals(groupId));
            
            if (!alreadyExists) {
                AvailableGroup availableGroup = new AvailableGroup();
                availableGroup.setTransferRequest(request);
                availableGroup.setGroup(group);
                availableGroup.setApproved(false);
                
                request.getAvailableGroups().add(availableGroup);
            }
        }
        
        // Update status to GROUP_FOUND
        request.setStatus(TransferRequestStatus.GROUP_FOUND);
        
        TransferRequest saved = transferRequestRepository.save(request);
        return toDTO(saved);
    }

    public TransferRequestDTO selectGroup(Integer requestId, SelectGroupDTO dto, Integer studentUserId) {
        TransferRequest request = findById(requestId);
        
        // Verify student owns this request
        if (!request.getStudent().getUser().getId().equals(studentUserId)) {
            throw new IllegalArgumentException("Student does not own this request");
        }
        
        // Validate status transition and user role
        validateStatusTransition(request, studentUserId, RoleEnum.STUDENT, TransferRequestStatus.TRANSFERRED);
        
        // Find the selected available group
        AvailableGroup selectedGroup = request.getAvailableGroups().stream()
                .filter(ag -> ag.getGroup().getId().equals(dto.getGroupId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Selected group is not in available groups"));
        
        // Mark as approved
        selectedGroup.setApproved(true);
        
        // Update status to TRANSFERRED
        request.setStatus(TransferRequestStatus.TRANSFERRED);
        request.setClosingTime(java.time.OffsetDateTime.now());
        
        // Actually transfer the student to the new group
        Group sourceGroup = request.getSourceGroup();
        Group targetGroup = selectedGroup.getGroup();
        
        // Remove from source group
        sourceGroup.getUserRoles().remove(request.getStudent());
        groupRepository.save(sourceGroup);
        
        // Add to target group
        if (!targetGroup.getUserRoles().contains(request.getStudent())) {
            targetGroup.getUserRoles().add(request.getStudent());
            groupRepository.save(targetGroup);
        }
        
        TransferRequest saved = transferRequestRepository.save(request);
        return toDTO(saved);
    }

    public TransferRequestDTO withdrawRequest(Integer requestId, Integer studentUserId) {
        TransferRequest request = findById(requestId);
        
        // Verify student owns this request
        if (!request.getStudent().getUser().getId().equals(studentUserId)) {
            throw new IllegalArgumentException("Student does not own this request");
        }
        
        // Validate status transition and user role
        validateStatusTransition(request, studentUserId, RoleEnum.STUDENT, TransferRequestStatus.REJECTED);
        
        request.setStatus(TransferRequestStatus.REJECTED);
        request.setClosingTime(java.time.OffsetDateTime.now());
        
        TransferRequest saved = transferRequestRepository.save(request);
        return toDTO(saved);
    }

    // Helper methods

    /**
     * Validates that a status transition is allowed for the given user role and that the user has the required role in the source group.
     * 
     * @param request The transfer request
     * @param userId The user ID
     * @param requiredRole The required role for this operation
     * @param targetStatus The target status to transition to
     * @throws IllegalArgumentException if the transition is not allowed or the user doesn't have the required role
     */
    private void validateStatusTransition(TransferRequest request, Integer userId, RoleEnum requiredRole, TransferRequestStatus targetStatus) {
        TransferRequestStatus currentStatus = request.getStatus();
        
        // Verify user has required role in the source group
        verifyUserRoleInGroup(request.getSourceGroup(), userId, requiredRole);
        
        // Get available statuses for the user's role
        List<TransferRequestStatus> availableStatuses = getAvailableStatusesForRole(currentStatus, requiredRole);
        
        if (!availableStatuses.contains(targetStatus)) {
            throw new IllegalArgumentException(
                    String.format("Cannot change status from %s to %s for role %s", 
                            currentStatus, targetStatus, requiredRole));
        }
    }

    private RoleEnum determineUserRoleInRequest(TransferRequest request, Integer userId) {
        // Check if user is the student
        if (request.getStudent().getUser().getId().equals(userId)) {
            return RoleEnum.STUDENT;
        }
        
        // Check if user is the manager
        if (request.getManager() != null && request.getManager().getUser().getId().equals(userId)) {
            return RoleEnum.MANAGER;
        }
        
        // Check if user is the curator
        if (request.getCurator() != null && request.getCurator().getUser().getId().equals(userId)) {
            return RoleEnum.CURATOR;
        }
        
        // Check if user has manager role in source group
        Group sourceGroup = request.getSourceGroup();
        if (hasRoleInGroup(sourceGroup, userId, RoleEnum.MANAGER)) {
            return RoleEnum.MANAGER;
        }
        
        // Check if user has curator role in source group
        if (hasRoleInGroup(sourceGroup, userId, RoleEnum.CURATOR)) {
            return RoleEnum.CURATOR;
        }
        
        throw new IllegalArgumentException("User does not have access to this request");
    }

    private boolean hasRoleInGroup(Group group, Integer userId, RoleEnum role) {
        return group.getUserRoles().stream()
                .anyMatch(ur -> ur.getUser().getId().equals(userId) && 
                               ur.getRole().getRole() == role);
    }

    private void verifyUserRoleInGroup(Group group, Integer userId, RoleEnum requiredRole) {
        if (!hasRoleInGroup(group, userId, requiredRole)) {
            throw new IllegalArgumentException(
                    String.format("User does not have %s role in the source group", requiredRole));
        }
    }

    private List<TransferRequestStatus> getAvailableStatusesForRole(TransferRequestStatus currentStatus, RoleEnum role) {
        return switch (role) {
            case STUDENT -> currentStatus.getNextAvailableStatusesForStudent();
            case MANAGER -> currentStatus.getNextAvailableStatusesForManager();
            case CURATOR -> currentStatus.getNextAvailableStatusesForCurator();
        };
    }

    private UserRole findCuratorInGroup(Group group) {
        return group.getUserRoles().stream()
                .filter(ur -> ur.getRole().getRole() == RoleEnum.CURATOR)
                .findFirst()
                .orElse(null);
    }

    // Conversion methods
    private TransferRequestDTO toDTO(TransferRequest request) {
        // Force lazy loading by accessing relationships
        UserRole student = request.getStudent();
        UserRole manager = request.getManager();
        UserRole curator = request.getCurator();
        Group sourceGroup = request.getSourceGroup();
        
        return TransferRequestDTO.builder()
                .id(request.getId())
                .student(toUserRoleDTO(student))
                .manager(manager != null ? toUserRoleDTO(manager) : null)
                .curator(curator != null ? toUserRoleDTO(curator) : null)
                .sourceGroup(TransferRequestDTO.SourceGroupDTO.builder()
                        .id(sourceGroup.getId())
                        .build())
                .reason(request.getReason())
                .curatorsComment(request.getCuratorsComment())
                .status(request.getStatus())
                .creationTime(request.getCreationTime())
                .closingTime(request.getClosingTime())
                .availableGroups(request.getAvailableGroups().stream()
                        .map(this::toAvailableGroupDTO)
                        .collect(Collectors.toList()))
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

    private AvailableGroupDTO toAvailableGroupDTO(AvailableGroup availableGroup) {
        return AvailableGroupDTO.builder()
                .id(availableGroup.getId())
                .group(AvailableGroupDTO.GroupDTO.builder()
                        .id(availableGroup.getGroup().getId())
                        .build())
                .approved(availableGroup.getApproved())
                .build();
    }

    // Get curators of a group for transfer request
    public List<UserRoleDTO> getGroupCurators(Integer requestId, Integer managerUserId) {
        TransferRequest request = findById(requestId);
        
        // Verify manager owns this request
        if (request.getManager() == null || !request.getManager().getUser().getId().equals(managerUserId)) {
            throw new IllegalArgumentException("Manager does not own this request");
        }
        
        Group sourceGroup = request.getSourceGroup();
        
        // Return empty list if no user roles or no curators found
        if (sourceGroup.getUserRoles() == null || sourceGroup.getUserRoles().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        List<UserRoleDTO> curators = sourceGroup.getUserRoles().stream()
                .filter(ur -> ur.getRole().getRole() == RoleEnum.CURATOR)
                .map(this::toUserRoleDTO)
                .collect(Collectors.toList());
        
        // Always return a list, even if empty
        return curators != null ? curators : new java.util.ArrayList<>();
    }
}
