package com.itmo.programmingclub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.Set;

@Entity
@Table(name = "schedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "class_start_time", nullable = false)
    private OffsetDateTime classStartTime;

    @Column(name = "class_end_time", nullable = false)
    private OffsetDateTime classEndTime;

    @Column(name = "is_relevant", nullable = false)
    private Boolean isRelevant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Class> classes;

    @PrePersist
    protected void onCreate() {
        if (classStartTime == null) {
            classStartTime = OffsetDateTime.now();
        }
        if (classEndTime == null && classStartTime != null) {
            classEndTime = classStartTime.plusHours(2);
        }
        if (isRelevant == null) {
            isRelevant = true;
        }
    }
}

