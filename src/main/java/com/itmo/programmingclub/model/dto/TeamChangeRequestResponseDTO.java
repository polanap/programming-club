package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.entity.TeamChangeRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamChangeRequestResponseDTO {
    private Integer id;
    private UserRoleDTO student;
    private UserRoleDTO curator;
    private String comment;
    private TeamChangeRequest.RequestStatus status;
    private OffsetDateTime creationTime;
    private OffsetDateTime closingTime;
    private TeamRef fromTeam;
    private TeamRef toTeam;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamRef {
        private Integer id;
    }
}

