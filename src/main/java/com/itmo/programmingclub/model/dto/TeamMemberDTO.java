package com.itmo.programmingclub.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeamMemberDTO {
    private Integer userRoleId;
    private Integer userId;
    private String fullName;
    private String username;
}
