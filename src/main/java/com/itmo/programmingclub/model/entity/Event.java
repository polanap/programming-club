package com.itmo.programmingclub.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "app_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "time", nullable = false)
    private OffsetDateTime time;

    @Column(name = "type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private EventType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_role_id")
    private UserRole userRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private Class classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @PrePersist
    protected void onCreate() {
        if (time == null) {
            time = OffsetDateTime.now();
        }
    }

    public enum EventType {
        TEAM_RAISED_HAND,
        TEAM_LOWERED_HAND,

        CURATOR_BLOCKED_TEAM,
        CURATOR_UNBLOCKED_TEAM,

        CURATOR_JOINED_TEAM,
        CURATOR_LEFT_TEAM,

        CURATOR_JOINED_CLASS,
        CURATOR_LEFT_CLASS,

        STUDENT_JOINED_CLASS,
        STUDENT_LEFT_CLASS,

        TEAM_SENT_SOLUTION,
        RESULT_OF_SOLUTION,
        
        TEAM_BEGAN_TO_COMPLETE_TASK
    }
}

