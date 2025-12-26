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
    private String userId;
}

