package com.itmo.programmingclub.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthorDTO {
    private Integer id;
    private String username;
    private String fullName;
}