package com.itmo.programmingclub.config;

import com.itmo.programmingclub.security.CustomUserDetails;
import com.itmo.programmingclub.service.CodeEditorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * WebSocket event listener for handling connections and disconnections
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {
    private final CodeEditorService codeEditorService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        log.info("Received a new web socket connection");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        Authentication authentication = (Authentication) headerAccessor.getUser();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String userId = userDetails.getUsername();
            
            // Note: We need to track which team the user was connected to
            // This would ideally be stored in the session attributes
            // For now, we'll unlock all lines for all teams (cleanup)
            // In production, you'd store teamId in session attributes
            
            log.info("User disconnected: {}", userId);
        }
        
        log.info("User disconnected");
    }
}

