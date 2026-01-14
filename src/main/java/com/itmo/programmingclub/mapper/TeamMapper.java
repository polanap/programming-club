package com.itmo.programmingclub.mapper;

import com.itmo.programmingclub.model.dto.TeamMemberDTO;
import com.itmo.programmingclub.model.dto.TeamResponseDTO;
import com.itmo.programmingclub.model.entity.Team;
import com.itmo.programmingclub.model.entity.User;
import com.itmo.programmingclub.model.entity.UserRole;
import com.itmo.programmingclub.model.entity.UserTeam;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class TeamMapper {
    public TeamResponseDTO toDto(Team team) {
        if (team == null) return null;

        TeamMemberDTO elderDto = null;

        List<TeamMemberDTO> membersDto = Collections.emptyList();

        if (team.getUserTeams() != null) {
            membersDto = team.getUserTeams().stream()
                    .map(this::toMemberDto)
                    .collect(Collectors.toList());

            if (team.getElder() != null) {
                Integer elderUserId = team.getElder().getId();
                elderDto = membersDto.stream()
                        .filter(m -> m.getUserId().equals(elderUserId))
                        .findFirst()
                        .orElse(null);
            }
        }

        return TeamResponseDTO.builder()
                .teamId(team.getId())
                .elder(elderDto)
                .members(membersDto)
                .build();
    }

    private TeamMemberDTO toMemberDto(UserTeam userTeam) {
        UserRole userRole = userTeam.getUserRole();
        User user = userRole.getUser();

        return TeamMemberDTO.builder()
                .userRoleId(userRole.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .build();
    }
}
