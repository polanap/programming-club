package com.itmo.programmingclub.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "user_role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToMany(mappedBy = "userRoles")
    @JsonIgnore
    private Set<Group> groups = new HashSet<>();

    @OneToMany(mappedBy = "userRole", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<UserTeam> userTeams;

    @OneToMany(mappedBy = "userRole", cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<Event> events;
}

