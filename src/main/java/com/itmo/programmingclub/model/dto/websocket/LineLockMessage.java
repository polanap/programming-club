package com.itmo.programmingclub.model.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LineLockMessage {
    private Integer teamId;
    private Integer lineNumber;
    private String userId;
    private String userRole;
    private String action; // LOCK, UNLOCK
}

