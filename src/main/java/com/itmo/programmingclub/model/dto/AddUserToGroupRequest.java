package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.RoleEnum;
import lombok.Data;

@Data
public class AddUserToGroupRequest {
    private Integer userId;
    private RoleEnum role;
}

