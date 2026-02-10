package com.itmo.programmingclub.service;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing code editing sessions and line locks
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CodeEditorService {
    // Map: teamId -> Map<lineNumber, LockInfo>
    private final Map<Integer, Map<Integer, LockInfo>> teamLocks = new ConcurrentHashMap<>();
    
    // Map: teamId -> Map<userId, code> - code by user
    private final Map<Integer, Map<String, String>> teamUserCode = new ConcurrentHashMap<>();
    
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
     * Check if a user can override a lock (based on priority)
     * @return true if user can override, false otherwise
     */
    public boolean canOverrideLock(Integer teamId, Integer lineNumber, String userId, String userRole) {
        Map<Integer, LockInfo> locks = teamLocks.get(teamId);
        if (locks != null) {
            LockInfo lock = locks.get(lineNumber);
            if (lock != null && !lock.getUserId().equals(userId)) {
                int existingPriority = getRolePriority(lock.getUserRole());
                int newPriority = getRolePriority(userRole);
                return newPriority > existingPriority;
            }
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
     * Store code for a specific user in a team
     */
    public void updateUserCode(Integer teamId, String userId, String code) {
        Map<String, String> userCodes = teamUserCode.computeIfAbsent(teamId, k -> new ConcurrentHashMap<>());
        userCodes.put(userId, code);
    }

    /**
     * Get code for a specific user in a team
     */
    public String getUserCode(Integer teamId, String userId) {
        Map<String, String> userCodes = teamUserCode.get(teamId);
        if (userCodes != null) {
            return userCodes.getOrDefault(userId, "");
        }
        return "";
    }

    /**
     * Get all user codes for a team
     */
    public Map<String, String> getAllUserCodes(Integer teamId) {
        return teamUserCode.getOrDefault(teamId, Collections.emptyMap());
    }

    /**
     * Store code for a team (legacy method for backward compatibility)
     */
    @Deprecated
    public void updateTeamCode(Integer teamId, String code) {
        // For backward compatibility, store as empty userId
        updateUserCode(teamId, "", code);
    }

    /**
     * Get current code for a team (legacy method - returns first available code)
     */
    @Deprecated
    public String getTeamCode(Integer teamId) {
        Map<String, String> userCodes = teamUserCode.get(teamId);
        if (userCodes != null && !userCodes.isEmpty()) {
            // Return first available code
            return userCodes.values().iterator().next();
        }
        return "";
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
                teamUserCode.remove(teamId);
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
     * Get code excluding lines locked by other users
     * Used for syncing - preserves lines that are locked by the requesting user
     */
    public String getCodeExcludingLockedLines(Integer teamId, String requestingUserId) {
        String fullCode = getTeamCode(teamId);
        if (fullCode == null || fullCode.isEmpty()) {
            return fullCode;
        }
        
        Map<Integer, LockInfo> locks = teamLocks.get(teamId);
        if (locks == null || locks.isEmpty()) {
            return fullCode;
        }
        
        // For now, return full code - client will handle preserving locked lines
        // This could be optimized to exclude locked lines on server side if needed
        return fullCode;
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

