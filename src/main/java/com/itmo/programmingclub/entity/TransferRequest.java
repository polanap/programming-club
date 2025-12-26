package com.itmo.programmingclub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.Set;

@Entity
@Table(name = "transfer_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransferRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserRole student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private UserRole manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curator_id")
    private UserRole curator;

    @Column(name = "curators_comment", columnDefinition = "TEXT")
    private String curatorsComment;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private TransferRequestStatus status;

    @Column(name = "creation_time", nullable = false)
    private OffsetDateTime creationTime;

    @Column(name = "closing_time")
    private OffsetDateTime closingTime;

    @OneToMany(mappedBy = "transferRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<AvailableGroup> availableGroups;

    @PrePersist
    protected void onCreate() {
        if (creationTime == null) {
            creationTime = OffsetDateTime.now();
        }
        if (status == null) {
            status = TransferRequestStatus.NEW;
        }
    }

    public enum TransferRequestStatus {
        APPROVED,
        REJECTED,
        NEW,
        UNDER_CONSIDERATION
    }
}

