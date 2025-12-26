package com.itmo.programmingclub.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "app_group")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @ManyToMany
    @JoinTable(
        name = "user_role_group",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(name = "user_role_id")
    )
    private Set<UserRole> userRoles = new HashSet<>();

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Schedule> schedules;

    @PrePersist
    protected void onCreate() {
        if (startTime == null) {
            // Set to far future to indicate group is not started yet
            startTime = OffsetDateTime.of(2100, 1, 1, 0, 0, 0, 0, OffsetDateTime.now().getOffset());
        }
    }
    
    public boolean isStarted() {
        // Group is started if startTime is not in the future (before year 2100)
        return startTime.isBefore(OffsetDateTime.of(2100, 1, 1, 0, 0, 0, 0, OffsetDateTime.now().getOffset()));
    }
}

