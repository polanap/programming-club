package com.itmo.programmingclub.model.dto;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class CreateScheduleRequest {
    private OffsetDateTime classStartTime;
    private OffsetDateTime classEndTime;
}

