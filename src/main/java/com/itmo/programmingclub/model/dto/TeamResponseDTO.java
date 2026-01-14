package com.itmo.programmingclub.model.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class TeamResponseDTO {
    private Integer teamId;
    private TeamMemberDTO elder;
    private List<TeamMemberDTO> members;
}
