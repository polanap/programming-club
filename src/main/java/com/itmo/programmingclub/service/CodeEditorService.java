package com.itmo.programmingclub.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing code editing sessions and line locks
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CodeEditorService {
    // Map: teamId -> Map<lineNumber, LockInfo>
    private final Map<Integer, Map<Integer, LockInfo>> teamLocks = new ConcurrentHashMap<>();
    
    // Map: teamId -> current code content
    private final Map<Integer, String> teamCode = new ConcurrentHashMap<>();
    
    // Map: teamId -> Set<userId> of connected users
    private final Map<Integer, Set<String>> teamConnections = new ConcurrentHashMap<>();

    public static class LockInfo {
        private final String userId;
        private final String userRole;
        private final long timestamp;

        public LockInfo(String userId, String userRole) {
            this.userId = userId;
            this.userRole = userRole;
            this.timestamp = System.currentTimeMillis();
        }

        public String getUserId() {
            return userId;
        }

        public String getUserRole() {
            return userRole;
        }

        public long getTimestamp() {
            return timestamp;
        }
    }

    /**
     * Try to lock a line for editing
     * @return true if lock was successful, false if line is already locked by someone else
     */
    public boolean tryLockLine(Integer teamId, Integer lineNumber, String userId, String userRole) {
        Map<Integer, LockInfo> locks = teamLocks.computeIfAbsent(teamId, k -> new ConcurrentHashMap<>());
        
        LockInfo existingLock = locks.get(lineNumber);
        if (existingLock != null && !existingLock.getUserId().equals(userId)) {
            // Check priority: CURATOR > ELDER > STUDENT
            int existingPriority = getRolePriority(existingLock.getUserRole());
            int newPriority = getRolePriority(userRole);
            
            // If new user has higher priority, override the lock
            if (newPriority > existingPriority) {
                locks.put(lineNumber, new LockInfo(userId, userRole));
                log.info("Line {} in team {} locked by {} ({}), overriding previous lock by {}", 
                        lineNumber, teamId, userId, userRole, existingLock.getUserId());
                return true;
            }
            
            return false; // Line is locked by someone with same or higher priority
        }
        
        locks.put(lineNumber, new LockInfo(userId, userRole));
        log.info("Line {} in team {} locked by {} ({})", lineNumber, teamId, userId, userRole);
        return true;
    }

    /**
     * Unlock a line
     */
    public void unlockLine(Integer teamId, Integer lineNumber, String userId) {
        Map<Integer, LockInfo> locks = teamLocks.get(teamId);
        if (locks != null) {
            LockInfo lock = locks.get(lineNumber);
            if (lock != null && lock.getUserId().equals(userId)) {
                locks.remove(lineNumber);
                log.info("Line {} in team {} unlocked by {}", lineNumber, teamId, userId);
            }
        }
    }

    /**
     * Unlock all lines locked by a user (when they disconnect)
     */
    public void unlockAllUserLines(Integer teamId, String userId) {
        Map<Integer, LockInfo> locks = teamLocks.get(teamId);
        if (locks != null) {
            locks.entrySet().removeIf(entry -> entry.getValue().getUserId().equals(userId));
            log.info("All lines in team {} unlocked by user {}", teamId, userId);
        }
    }

    /**
     * Check if a line is locked by someone else
     */
    public boolean isLineLockedByOther(Integer teamId, Integer lineNumber, String userId) {
        Map<Integer, LockInfo> locks = teamLocks.get(teamId);
        if (locks != null) {
            LockInfo lock = locks.get(lineNumber);
            return lock != null && !lock.getUserId().equals(userId);
        }
        return false;
    }

    /**
     * Get lock information for a line
     */
    public LockInfo getLineLock(Integer teamId, Integer lineNumber) {
        Map<Integer, LockInfo> locks = teamLocks.get(teamId);
        if (locks != null) {
            return locks.get(lineNumber);
        }
        return null;
    }

    /**
     * Store code for a team
     */
    public void updateTeamCode(Integer teamId, String code) {
        teamCode.put(teamId, code);
    }

    /**
     * Get current code for a team
     */
    public String getTeamCode(Integer teamId) {
        return teamCode.getOrDefault(teamId, "");
    }

    /**
     * Add user connection to team
     */
    public void addUserConnection(Integer teamId, String userId) {
        teamConnections.computeIfAbsent(teamId, k -> ConcurrentHashMap.newKeySet()).add(userId);
    }

    /**
     * Remove user connection from team
     */
    public void removeUserConnection(Integer teamId, String userId) {
        Set<String> users = teamConnections.get(teamId);
        if (users != null) {
            users.remove(userId);
            if (users.isEmpty()) {
                teamConnections.remove(teamId);
                teamCode.remove(teamId);
                teamLocks.remove(teamId);
            }
        }
        unlockAllUserLines(teamId, userId);
    }

    /**
     * Get all connected users for a team
     */
    public Set<String> getTeamConnections(Integer teamId) {
        return teamConnections.getOrDefault(teamId, Collections.emptySet());
    }

    /**
     * Get role priority (higher number = higher priority)
     * CURATOR = 3, ELDER = 2, STUDENT = 1
     */
    private int getRolePriority(String role) {
        if ("CURATOR".equalsIgnoreCase(role)) {
            return 3;
        } else if ("ELDER".equalsIgnoreCase(role)) {
            return 2;
        } else {
            return 1; // STUDENT
        }
    }
}

