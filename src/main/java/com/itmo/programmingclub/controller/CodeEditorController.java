package com.itmo.programmingclub.controller;

import java.util.Arrays;
import java.util.Optional;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.itmo.programmingclub.model.dto.websocket.CodeChangeMessage;
import com.itmo.programmingclub.model.dto.websocket.CodeSyncMessage;
import com.itmo.programmingclub.model.dto.websocket.CursorPositionMessage;
import com.itmo.programmingclub.model.dto.websocket.LineLockMessage;
import com.itmo.programmingclub.model.entity.Team;
import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.security.CustomUserDetails;
import com.itmo.programmingclub.service.CodeEditorService;
import com.itmo.programmingclub.service.TeamService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * WebSocket controller for code editing collaboration
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class CodeEditorController {
    private final CodeEditorService codeEditorService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TeamService teamService;

    /**
     * Handle code changes from client
     * Client sends to: /app/code/change/{teamId}
     * Server broadcasts to: /topic/code/change/{teamId}
     */
    @MessageMapping("/code/change/{teamId}")
    @SendTo("/topic/code/change/{teamId}")
    public CodeChangeMessage handleCodeChange(
            @DestinationVariable Integer teamId,
            CodeChangeMessage message,
            Authentication authentication) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUsername();
        String userRole = determineUserRole(userDetails, teamId);

        message.setUserId(userId);
        message.setUserRole(userRole);
        message.setTeamId(teamId);

        // No need for line locking since each user has their own area
        // Users can only edit their own area, so no conflicts

        // Update code in service for this specific user - replace entire code
        // When content contains newlines, it's the full code, otherwise it's a single line
        String newCode;
        if (message.getContent() != null && message.getContent().contains("\n")) {
            // Full code is being sent
            newCode = message.getContent();
        } else {
            // Single line update (legacy support)
            String currentCode = codeEditorService.getUserCode(teamId, userId);
            newCode = applyChange(currentCode, message);
        }
        codeEditorService.updateUserCode(teamId, userId, newCode);

        log.debug("Code change from user {} in team {}: line {} updated", userId, teamId, message.getLineNumber());
        return message;
    }

    /**
     * Handle cursor position updates
     * Client sends to: /app/cursor/{teamId}
     * Server broadcasts to: /topic/cursor/{teamId}
     */
    @MessageMapping("/cursor/{teamId}")
    @SendTo("/topic/cursor/{teamId}")
    public CursorPositionMessage handleCursorPosition(
            @DestinationVariable Integer teamId,
            CursorPositionMessage message,
            Authentication authentication) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        message.setUserId(userDetails.getUsername());
        message.setUserRole(determineUserRole(userDetails, teamId));
        message.setTeamId(teamId);
        
        return message;
    }

    /**
     * Handle line lock/unlock requests
     * Client sends to: /app/lock/{teamId}
     * Server broadcasts to: /topic/lock/{teamId}
     */
    @MessageMapping("/lock/{teamId}")
    public void handleLineLock(
            @DestinationVariable Integer teamId,
            LineLockMessage message,
            Authentication authentication) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUsername();
        String userRole = determineUserRole(userDetails, teamId);

        message.setUserId(userId);
        message.setUserRole(userRole);
        message.setTeamId(teamId);

        if ("LOCK".equals(message.getAction())) {
            boolean success = codeEditorService.tryLockLine(
                    teamId, message.getLineNumber(), userId, userRole);
            
            if (success) {
                // Broadcast lock to all team members
                messagingTemplate.convertAndSend("/topic/lock/" + teamId, message);
            } else {
                // Send rejection to the user who tried to lock
                message.setAction("LOCK_REJECTED");
                messagingTemplate.convertAndSendToUser(userId, "/queue/lock/reject", message);
            }
        } else if ("UNLOCK".equals(message.getAction())) {
            codeEditorService.unlockLine(teamId, message.getLineNumber(), userId);
            // Broadcast unlock to all team members
            messagingTemplate.convertAndSend("/topic/lock/" + teamId, message);
        }
    }

    /**
     * Handle code sync request (when new user joins)
     * Client sends to: /app/code/sync/request/{teamId}
     * Server broadcasts to: /topic/code/sync/request/{teamId}
     */
    @MessageMapping("/code/sync/request/{teamId}")
    @SendTo("/topic/code/sync/request/{teamId}")
    public CodeSyncMessage handleCodeSyncRequest(
            @DestinationVariable Integer teamId,
            CodeSyncMessage message,
            Authentication authentication) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUsername();

        // Add user to team connections
        codeEditorService.addUserConnection(teamId, userId);

        message.setRequestingUserId(userId);
        message.setTeamId(teamId);

        log.info("User {} requested code sync for team {}", userId, teamId);
        return message;
    }

    /**
     * Handle code sync response (when participant sends code to new user)
     * Client sends to: /app/code/sync/response/{teamId}
     * Server broadcasts to: /topic/code/sync/response/{teamId}
     */
    @MessageMapping("/code/sync/response/{teamId}")
    @SendTo("/topic/code/sync/response/{teamId}")
    public CodeSyncMessage handleCodeSyncResponse(
            @DestinationVariable Integer teamId,
            CodeSyncMessage message,
            Authentication authentication) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String fromUserId = userDetails.getUsername();

        message.setFromUserId(fromUserId);
        message.setTeamId(teamId);
        // requestingUserId is already set by client

        log.info("User {} sent code for team {} (requested by {}). Code length: {}", 
                fromUserId, teamId, message.getRequestingUserId(),
                message.getCode() != null ? message.getCode().length() : 0);
        
        return message;
    }

    /**
     * Determine user role (STUDENT, CURATOR, ELDER)
     */
    private String determineUserRole(CustomUserDetails userDetails, Integer teamId) {
        // Check if user is CURATOR
        boolean isCurator = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CURATOR"));
        if (isCurator) {
            return "CURATOR";
        }

        // Check if user is ELDER (oldest) of the team
        Optional<Team> teamOpt = teamService.findById(teamId);
        if (teamOpt.isPresent()) {
            Team team = teamOpt.get();
            User elder = team.getElder();
            User currentUser = userDetails.getUser();
            
            if (elder != null && elder.getId().equals(currentUser.getId())) {
                return "ELDER";
            }
        }

        return "STUDENT";
    }

    /**
     * Apply code change - replace entire line
     */
    private String applyChange(String currentCode, CodeChangeMessage change) {
        if (currentCode == null) {
            currentCode = "";
        }

        String[] lines = currentCode.split("\n", -1);
        int lineIndex = change.getLineNumber() - 1; // Line numbers are 1-based

        // Ensure line exists
        if (lineIndex < 0) {
            log.warn("Invalid line number: {}", change.getLineNumber());
            return currentCode;
        }
        
        // Add new lines if needed
        while (lines.length <= lineIndex) {
            lines = Arrays.copyOf(lines, lines.length + 1);
            lines[lines.length - 1] = "";
        }

        // Replace entire line with new content
        lines[lineIndex] = change.getContent() != null ? change.getContent() : "";

        return String.join("\n", lines);
    }
}

