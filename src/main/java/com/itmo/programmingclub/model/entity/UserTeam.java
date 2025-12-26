package com.itmo.programmingclub.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Entity
@Table(name = "user_team")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTeam {
    @EmbeddedId
    private UserTeamId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userRoleId")
    @JoinColumn(name = "user_role_id", nullable = false)
    private UserRole userRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teamId")
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class UserTeamId implements Serializable {
        @Column(name = "user_role_id")
        private Integer userRoleId;

        @Column(name = "team_id")
        private Integer teamId;
    }
}
