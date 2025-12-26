package com.itmo.programmingclub.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CursorPositionMessage {
    private Integer teamId;
    private Integer lineNumber;
    private Integer position;
    private String userId;
    private String userRole;
}

