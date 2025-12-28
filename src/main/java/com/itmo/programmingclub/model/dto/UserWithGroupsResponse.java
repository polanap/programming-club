package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.RoleEnum;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserWithGroupsResponse {
    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private List<RoleEnum> roles;
    private List<Integer> groupIds;
}

