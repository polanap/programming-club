package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.RoleEnum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleDTO {
    private Integer id;
    private UserDTO user;
    private RoleDTO role;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDTO {
        private Integer id;
        private String username;
        private String fullName;
        private String email;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleDTO {
        private Integer id;
        private RoleEnum role;
    }
}
