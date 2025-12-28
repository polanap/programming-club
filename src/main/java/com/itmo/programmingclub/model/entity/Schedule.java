package com.itmo.programmingclub.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
<<<<<<< Updated upstream
import com.itmo.programmingclub.model.DayOfWeek;
=======
>>>>>>> Stashed changes
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
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

    @Column(name = "day_of_week", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private DayOfWeek dayOfWeek;

    @Column(name = "class_start_time", nullable = false)
    private LocalTime classStartTime;

    @Column(name = "class_end_time", nullable = false)
    private LocalTime classEndTime;

    @Column(name = "is_relevant", nullable = false)
    private Boolean isRelevant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnore
    private Group group;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Class> classes;

    @PrePersist
    protected void onCreate() {
        if (isRelevant == null) {
            isRelevant = true;
        }
    }
}
