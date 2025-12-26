package com.itmo.programmingclub.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Entity
@Table(name = "user_role_group")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleGroup {
    @EmbeddedId
    private UserRoleGroupId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userRoleId")
    @JoinColumn(name = "user_role_id", nullable = false)
    private UserRole userRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("groupId")
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class UserRoleGroupId implements Serializable {
        @Column(name = "user_role_id")
        private Integer userRoleId;

        @Column(name = "group_id")
        private Integer groupId;
    }
}
