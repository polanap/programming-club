package com.itmo.programmingclub.model.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeSyncMessage {
    private Integer teamId;
    private String code; // Full code content
    private String userId; // User who owns/sends the code
    private String requestingUserId; // User who requested the code
    private String fromUserId; // User who is sending the code (in response)
    private String toUserId; // User who should receive the code (in response)
    private String userRole; // Role of the user sending the code (STUDENT, ELDER, CURATOR)
}

