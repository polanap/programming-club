package com.itmo.programmingclub.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "elder_change_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElderChangeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserRole student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_elder_id", nullable = false)
    private UserRole newElder;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @Column(name = "creation_time", nullable = false)
    private OffsetDateTime creationTime;

    @Column(name = "closing_time")
    private OffsetDateTime closingTime;

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

