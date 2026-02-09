package com.itmo.programmingclub.model.dto;

import com.itmo.programmingclub.model.entity.Event;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private Integer id;
    private OffsetDateTime time;
    private Event.EventType type;
    private Integer teamId;
    private Integer userRoleId;
    private Integer submissionId;
    private Integer classId;
    private Integer taskId;
    
    public static EventDTO fromEntity(Event event) {
        if (event == null) {
            return null;
        }
        
        return EventDTO.builder()
                .id(event.getId())
                .time(event.getTime())
                .type(event.getType())
                .teamId(event.getTeam() != null ? event.getTeam().getId() : null)
                .userRoleId(event.getUserRole() != null ? event.getUserRole().getId() : null)
                .submissionId(event.getSubmission() != null ? event.getSubmission().getId() : null)
                .classId(event.getClassEntity() != null ? event.getClassEntity().getId() : null)
                .taskId(event.getTask() != null ? event.getTask().getId() : null)
                .build();
    }
}
