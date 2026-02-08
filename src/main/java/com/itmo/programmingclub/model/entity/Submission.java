package com.itmo.programmingclub.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Duration;
import java.util.Set;

@Entity
@Table(name = "submission")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JdbcTypeCode(SqlTypes.INTERVAL_SECOND)
    @Column(name = "complition_time", nullable = false)
    private Duration complitionTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private SubmissionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL)
    private Set<Event> events;

    @Column(name = "code", columnDefinition = "TEXT")
    private String code;

    @Column(name = "language", length = 50)
    private String language;

    public enum SubmissionStatus {
        OK,
        FAILED,
        IN_PROCESS
    }
}

