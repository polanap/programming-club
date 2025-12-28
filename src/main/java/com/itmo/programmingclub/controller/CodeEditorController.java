package com.itmo.programmingclub.controller;

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
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.Arrays;
import java.util.Optional;

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

        // Check if line is locked by someone else
        if (message.getLineNumber() != null && 
            codeEditorService.isLineLockedByOther(teamId, message.getLineNumber(), userId)) {
            log.warn("User {} attempted to edit locked line {} in team {}", 
                    userId, message.getLineNumber(), teamId);
            // Send rejection message to the user
            messagingTemplate.convertAndSendToUser(
                    userId, 
                    "/queue/code/reject", 
                    message);
            return null; // Don't broadcast the change
        }

        // Update code in service
        String currentCode = codeEditorService.getTeamCode(teamId);
        // Simple code update logic (in production, you'd use a more sophisticated diff algorithm)
        codeEditorService.updateTeamCode(teamId, applyChange(currentCode, message));

        log.debug("Code change from user {} in team {}: {}", userId, teamId, message.getType());
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
     * Handle code sync request (when user joins)
     * Client sends to: /app/sync/{teamId}
     * Server sends to: /user/{username}/queue/code/sync
     */
    @MessageMapping("/sync/{teamId}")
    public void handleCodeSync(
            @DestinationVariable Integer teamId,
            CodeSyncMessage message,
            Authentication authentication) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String userId = userDetails.getUsername();

        // Add user to team connections
        codeEditorService.addUserConnection(teamId, userId);

        // Send current code to the user
        String currentCode = codeEditorService.getTeamCode(teamId);
        CodeSyncMessage syncResponse = new CodeSyncMessage(teamId, currentCode, userId);
        messagingTemplate.convertAndSendToUser(userId, "/queue/code/sync", syncResponse);

        log.info("User {} synced with team {} code", userId, teamId);
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
     * Simple code change application (for demonstration)
     * In production, use Operational Transformation or CRDT algorithms
     */
    private String applyChange(String currentCode, CodeChangeMessage change) {
        if (currentCode == null) {
            currentCode = "";
        }

        String[] lines = currentCode.split("\n", -1);
        int lineIndex = change.getLineNumber() - 1; // Line numbers are 1-based

        if (lineIndex < 0 || lineIndex >= lines.length) {
            // Add new lines if needed
            while (lines.length <= lineIndex) {
                lines = Arrays.copyOf(lines, lines.length + 1);
                lines[lines.length - 1] = "";
            }
        }

        String line = lines[lineIndex];
        switch (change.getType()) {
            case "INSERT":
                int pos = change.getPosition() != null ? change.getPosition() : line.length();
                if (pos < 0) pos = 0;
                if (pos > line.length()) pos = line.length();
                lines[lineIndex] = line.substring(0, pos) + change.getContent() + line.substring(pos);
                break;
            case "DELETE":
                pos = change.getPosition() != null ? change.getPosition() : line.length();
                int length = change.getContent() != null ? change.getContent().length() : 1;
                if (pos + length > line.length()) length = line.length() - pos;
                if (pos >= 0 && pos < line.length()) {
                    lines[lineIndex] = line.substring(0, pos) + line.substring(pos + length);
                }
                break;
            case "REPLACE":
                lines[lineIndex] = change.getContent() != null ? change.getContent() : "";
                break;
        }

        return String.join("\n", lines);
    }
}

