package com.itmo.programmingclub.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "team_change_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamChangeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserRole student;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @Column(name = "creation_time", nullable = false)
    private OffsetDateTime creationTime;

    @Column(name = "closing_time")
    private OffsetDateTime closingTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curator_id")
    private UserRole curator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_team_id")
    private Team fromTeam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_team_id")
    private Team toTeam;

    @PrePersist
    protected void onCreate() {
        if (creationTime == null) {
            creationTime = OffsetDateTime.now();
        }
        if (status == null) {
            status = RequestStatus.NEW;
        }
    }

    public enum RequestStatus {
        APPROVED,
        REJECTED,
        NEW
    }
}

