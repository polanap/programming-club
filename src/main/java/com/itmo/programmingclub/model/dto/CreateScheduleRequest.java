package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.DayOfWeek;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateScheduleRequest {
    private DayOfWeek dayOfWeek;
    private LocalTime classStartTime;
    private LocalTime classEndTime;
}
