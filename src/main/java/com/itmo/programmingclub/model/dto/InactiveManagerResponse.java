package com.itmo.programmingclub.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InactiveManagerResponse {
    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private OffsetDateTime registrationDate;
}

