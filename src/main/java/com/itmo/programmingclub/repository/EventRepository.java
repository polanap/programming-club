package com.itmo.programmingclub.repository;

import com.itmo.programmingclub.model.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    List<Event> findByClassEntityId(Integer classId);
    List<Event> findByTimeBetween(OffsetDateTime startTime, OffsetDateTime endTime);
    List<Event> findByClassEntityIdAndTimeBetween(Integer classId, OffsetDateTime startTime, OffsetDateTime endTime);
    List<Event> findByTeamId(Integer teamId);
    
    /**
     * Finds events for a team filtered by event types, ordered by time descending.
     */
    @Query("SELECT e FROM Event e WHERE e.team.id = :teamId AND e.type IN :types ORDER BY e.time DESC LIMIT 1")
    List<Event> findByTeamIdAndTypeInOrderByTimeDesc(@Param("teamId") Integer teamId, @Param("types") List<Event.EventType> types);
    
    /**
     * Finds the most recent event for a team filtered by event types.
     */
    @Query("SELECT e FROM Event e WHERE e.team.id = :teamId AND e.type IN :types ORDER BY e.time DESC LIMIT 1")
    Optional<Event> findTopByTeamIdAndTypeInOrderByTimeDesc(@Param("teamId") Integer teamId, @Param("types") List<Event.EventType> types);
    
    /**
     * Finds events for a team and specific user role filtered by event types, ordered by time descending.
     */
    @Query("SELECT e FROM Event e WHERE e.team.id = :teamId AND e.userRole.id = :userRoleId AND e.type IN :types ORDER BY e.time DESC LIMIT 1")
    List<Event> findByTeamIdAndUserRoleIdAndTypeInOrderByTimeDesc(@Param("teamId") Integer teamId, @Param("userRoleId") Integer userRoleId, @Param("types") List<Event.EventType> types);
    
    /**
     * Finds the most recent event for a team and specific user role filtered by event types.
     */
    @Query("SELECT e FROM Event e WHERE e.team.id = :teamId AND e.userRole.id = :userRoleId AND e.type IN :types ORDER BY e.time DESC LIMIT 1")
    Optional<Event> findTopByTeamIdAndUserRoleIdAndTypeInOrderByTimeDesc(@Param("teamId") Integer teamId, @Param("userRoleId") Integer userRoleId, @Param("types") List<Event.EventType> types);
    
    /**
     * Finds the most recent task selection event for a team.
     */
    @Query("SELECT e FROM Event e WHERE e.team.id = :teamId AND e.type = :type ORDER BY e.time DESC LIMIT 1")
    Optional<Event> findTopByTeamIdAndTypeOrderByTimeDesc(@Param("teamId") Integer teamId, @Param("type") Event.EventType type);
    
    /**
     * Gets distinct user role IDs from join/leave events for a team.
     * Used to find all curators who have ever interacted with the team.
     */
    @Query("SELECT DISTINCT e.userRole.id FROM Event e WHERE e.team.id = :teamId AND e.type IN :types AND e.userRole IS NOT NULL")
    List<Integer> findDistinctUserRoleIdsByTeamIdAndTypeIn(@Param("teamId") Integer teamId, @Param("types") List<Event.EventType> types);
}

