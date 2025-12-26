package com.itmo.programmingclub.model.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class GroupResponse {
    private Integer id;
    private OffsetDateTime startTime;
    private boolean isStarted;
    private boolean canStart; // true if has students, curator, and schedule
}

