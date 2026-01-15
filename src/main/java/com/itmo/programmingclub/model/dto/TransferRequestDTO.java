package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.TransferRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferRequestDTO {
    private Integer id;
    private UserRoleDTO student;
    private UserRoleDTO manager;
    private UserRoleDTO curator;
    private SourceGroupDTO sourceGroup;
    private String reason;
    private String curatorsComment;
    private TransferRequestStatus status;
    private OffsetDateTime creationTime;
    private OffsetDateTime closingTime;
    private List<AvailableGroupDTO> availableGroups;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceGroupDTO {
        private Integer id;
    }
}
