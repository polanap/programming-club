package com.itmo.programmingclub.model.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeChangeMessage {
    private String type; // INSERT, DELETE, REPLACE
    private Integer teamId;
    private Integer lineNumber;
    private String content; // New content or content to delete
    private Integer position; // Position in line
    private String userId; // Username or user ID
    private String userRole; // STUDENT, CURATOR, ELDER
}

