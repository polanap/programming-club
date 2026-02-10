import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { CodeChangeMessage, AuthUser } from '../../types';
import styles from './CodeEditor.module.scss';

interface CodeEditorProps {
  teamId: number;
  taskId: number;
  isElder: boolean;
  isCurator: boolean;
  onCodeChange?: (code: string) => void; // Callback to get elder's code for submission
}

interface UserCodeArea {
  userId: string;
  username: string;
  userRole: string;
  code: string;
  isEditable: boolean; // Can current user edit this area
}

const CodeEditor: React.FC<CodeEditorProps> = ({ teamId, taskId, isElder, isCurator, onCodeChange }) => {
  // Map: userId -> UserCodeArea
  const [userCodeAreas, setUserCodeAreas] = useState<Map<string, UserCodeArea>>(new Map());
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const stompClientRef = useRef<Client | null>(null);
  const isConnectedRef = useRef(false);
  const currentTeamIdRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const receivedCodesRef = useRef<Array<{ fromUserId: string; code: string; timestamp: number }>>([]);
  
  const userStr = localStorage.getItem('user');
  const user: AuthUser | null = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');
  
  // Determine user role for priority
  const getUserRole = (): string => {
    if (isCurator) return 'CURATOR';
    if (isElder) return 'ELDER';
    return 'STUDENT';
  };

  // Get current user's code area
  const getCurrentUserArea = useCallback((): UserCodeArea | null => {
    if (!user) return null;
    return userCodeAreas.get(user.username) || null;
  }, [userCodeAreas, user]);

  // Update code in specific user's area
  const updateUserCode = useCallback((userId: string, newCode: string) => {
    setUserCodeAreas((prev) => {
      const newAreas = new Map(prev);
      const existing = newAreas.get(userId);
      if (existing) {
        newAreas.set(userId, {
          ...existing,
          code: newCode,
        });
      } else {
        // Create new area if it doesn't exist
        newAreas.set(userId, {
          userId,
          username: userId, // Will be updated when we get user info
          userRole: 'STUDENT',
          code: newCode,
          isEditable: userId === user?.username,
        });
      }
      return newAreas;
    });
  }, [user]);

  // Apply change from another user
  const applyChange = useCallback((change: CodeChangeMessage) => {
    // Only apply changes to the area of the user who made the change
    if (change.userId && change.userId !== user?.username) {
      setUserCodeAreas((prev) => {
        const newAreas = new Map(prev);
        const existing = newAreas.get(change.userId);
        
        if (existing) {
          const lines = existing.code.split('\n');
          const lineIndex = change.lineNumber - 1;
          
          // Ensure line exists
          while (lineIndex >= lines.length) {
            lines.push('');
          }
          
          if (lineIndex >= 0) {
            lines[lineIndex] = change.content || '';
            newAreas.set(change.userId, {
              ...existing,
              code: lines.join('\n'),
            });
          }
        } else {
          // Create new area if it doesn't exist
          const lines: string[] = [];
          while (lines.length <= change.lineNumber - 1) {
            lines.push('');
          }
          lines[change.lineNumber - 1] = change.content || '';
          newAreas.set(change.userId, {
            userId: change.userId,
            username: change.userId,
            userRole: change.userRole || 'STUDENT',
            code: lines.join('\n'),
            isEditable: false,
          });
        }
        
        return newAreas;
      });
    }
  }, [user]);

  // Notify parent component about elder's code change (for submission)
  useEffect(() => {
    if (onCodeChange && isElder && user) {
      const elderArea = userCodeAreas.get(user.username);
      if (elderArea) {
        onCodeChange(elderArea.code);
      }
    }
  }, [userCodeAreas, isElder, user, onCodeChange]);

  useEffect(() => {
    // Only connect when component mounts and teamId is available
    if (!teamId || !token || !user) {
      return;
    }

    // If teamId changed, disconnect from previous team and reconnect
    if (currentTeamIdRef.current !== null && currentTeamIdRef.current !== teamId) {
      console.log('Team ID changed from', currentTeamIdRef.current, 'to', teamId, '- reconnecting');
      if (stompClientRef.current?.connected) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      isConnectedRef.current = false;
      setUserCodeAreas(new Map());
      currentTeamIdRef.current = null;
    }

    // Prevent multiple handshakes for the same teamId
    if (isConnectedRef.current && currentTeamIdRef.current === teamId && stompClientRef.current?.connected) {
      console.log('WebSocket already connected for team:', teamId);
      return;
    }
    
    // If client exists but not connected, clean it up first
    if (stompClientRef.current && !stompClientRef.current.connected) {
      console.log('Cleaning up disconnected client before reconnecting');
      stompClientRef.current.deactivate().catch(() => {});
      stompClientRef.current = null;
      isConnectedRef.current = false;
    }

    console.log('Connecting WebSocket for team:', teamId);
    isConnectedRef.current = true;
    currentTeamIdRef.current = teamId;

    const socket = new SockJS('http://localhost:8181/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 0, // Disable automatic reconnection - we handle it manually
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log('WebSocket connected');
        
        // Subscribe to code sync requests - when someone requests code, send ours
        client.subscribe(`/topic/code/sync/request/${teamId}`, (message: IMessage) => {
          try {
            const request = JSON.parse(message.body);
            console.log('Received code sync request from:', request.requestingUserId);
            
            // Don't send code to ourselves
            if (request.requestingUserId === user?.username) {
              return;
            }
            
            // Send our current code in the topic (broadcast)
            // Get current area from state directly to avoid dependency issues
            setUserCodeAreas((prev) => {
              const currentArea = prev.get(user?.username || '');
              if (currentArea || true) { // Always send, even if empty
                // Always send code, even if empty, so the new user knows about our area
                console.log('Sending code in topic for requesting user:', request.requestingUserId);
                client.publish({
                  destination: `/app/code/sync/response/${teamId}`,
                  body: JSON.stringify({
                    teamId,
                    code: currentArea?.code || '',
                    fromUserId: user?.username,
                    requestingUserId: request.requestingUserId, // Include requesting user ID so new user can filter
                  }),
                });
              }
              return prev; // Return unchanged
            });
          } catch (err) {
            console.error('Error handling code sync request:', err);
          }
        });

        // Subscribe to code sync responses in topic - when participants send their code
        client.subscribe(`/topic/code/sync/response/${teamId}`, (message: IMessage) => {
          try {
            const sync = JSON.parse(message.body);
            console.log('Received code sync response from:', sync.fromUserId, 'Code length:', sync.code?.length);
            
            // Only process if this response is for us (when we requested) or if requestingUserId is not set (legacy)
            if (sync.requestingUserId && sync.requestingUserId !== user?.username) {
              console.log('Ignoring code sync response not intended for us');
              return;
            }
            
            // Ignore code from ourselves
            if (sync.fromUserId === user?.username) {
              console.log('Ignoring code sync from self');
              return;
            }
            
            // Store received code with timestamp
            receivedCodesRef.current.push({
              fromUserId: sync.fromUserId,
              code: sync.code || '',
              timestamp: Date.now(),
            });
            
            // Wait a bit to collect all responses, then apply them
            if (syncTimeoutRef.current) {
              clearTimeout(syncTimeoutRef.current);
            }
            
            syncTimeoutRef.current = setTimeout(() => {
              if (receivedCodesRef.current.length === 0) {
                return;
              }
              
              // Filter out codes from self (just in case)
              const validCodes = receivedCodesRef.current.filter(
                c => c.fromUserId !== user?.username
              );
              
              if (validCodes.length === 0) {
                console.warn('No valid code received from other participants');
                receivedCodesRef.current = [];
                return;
              }
              
              console.log('Applying codes from', validCodes.length, 'participants');
              
              // Apply each code to its corresponding user area
              // Also create areas for users we received code from
              validCodes.forEach((codeData) => {
                setUserCodeAreas((prev) => {
                  const newAreas = new Map(prev);
                  const existing = newAreas.get(codeData.fromUserId);
                  if (existing) {
                    newAreas.set(codeData.fromUserId, {
                      ...existing,
                      code: codeData.code,
                    });
                  } else {
                    // Create new area for this user
                    newAreas.set(codeData.fromUserId, {
                      userId: codeData.fromUserId,
                      username: codeData.fromUserId,
                      userRole: 'STUDENT', // Will be updated when we receive changes
                      code: codeData.code,
                      isEditable: false, // Not editable by current user
                    });
                  }
                  return newAreas;
                });
              });
              
              receivedCodesRef.current = [];
            }, 500); // Wait 500ms to collect all responses
          } catch (err) {
            console.error('Error parsing code sync response:', err);
          }
        });

        // Request code from all participants
        console.log('Requesting code from all participants');
        client.publish({
          destination: `/app/code/sync/request/${teamId}`,
          body: JSON.stringify({
            teamId,
            requestingUserId: user?.username,
          }),
        });

        // Subscribe to code changes
        client.subscribe(`/topic/code/change/${teamId}`, (message: IMessage) => {
          try {
            const change: CodeChangeMessage = JSON.parse(message.body);
            console.log('Received code change:', change);
            // Apply changes from other users to their areas
            if (change.userId && change.userId !== user?.username) {
              console.log('Applying change from user:', change.userId);
              // Apply change directly without using callback to avoid dependency issues
              setUserCodeAreas((prev) => {
                const newAreas = new Map(prev);
                const existing = newAreas.get(change.userId);
                
                // Check if content contains newlines - if so, it's full code
                const isFullCode = change.content && change.content.includes('\n');
                
                if (isFullCode) {
                  // Full code update - replace entire code
                  if (existing) {
                    newAreas.set(change.userId, {
                      ...existing,
                      code: change.content || '',
                    });
                  } else {
                    // Create new area with full code
                    newAreas.set(change.userId, {
                      userId: change.userId,
                      username: change.userId,
                      userRole: change.userRole || 'STUDENT',
                      code: change.content || '',
                      isEditable: false,
                    });
                  }
                } else {
                  // Single line update (legacy support)
                  if (existing) {
                    const lines = existing.code.split('\n');
                    const lineIndex = change.lineNumber - 1;
                    
                    // Ensure line exists
                    while (lineIndex >= lines.length) {
                      lines.push('');
                    }
                    
                    if (lineIndex >= 0) {
                      lines[lineIndex] = change.content || '';
                      newAreas.set(change.userId, {
                        ...existing,
                        code: lines.join('\n'),
                      });
                    }
                  } else {
                    // Create new area if it doesn't exist
                    const lines: string[] = [];
                    while (lines.length <= change.lineNumber - 1) {
                      lines.push('');
                    }
                    lines[change.lineNumber - 1] = change.content || '';
                    newAreas.set(change.userId, {
                      userId: change.userId,
                      username: change.userId,
                      userRole: change.userRole || 'STUDENT',
                      code: lines.join('\n'),
                      isEditable: false,
                    });
                  }
                }
                
                return newAreas;
              });
            }
          } catch (err) {
            console.error('Error parsing code change message:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        isConnectedRef.current = false;
        // Don't try to reconnect automatically - let cleanup handle it
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        isConnectedRef.current = false;
        // Don't try to reconnect automatically - let cleanup handle it
      },
      onWebSocketClose: () => {
        console.log('WebSocket closed');
        isConnectedRef.current = false;
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Cleanup function
    return () => {
      if (currentTeamIdRef.current === teamId) {
        console.log('Cleaning up WebSocket connection for team:', teamId);
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        receivedCodesRef.current = [];
        if (stompClientRef.current) {
          // Deactivate without reconnecting
          stompClientRef.current.deactivate().then(() => {
            console.log('WebSocket deactivated');
          }).catch((err) => {
            console.error('Error deactivating WebSocket:', err);
          });
          stompClientRef.current = null;
        }
        isConnectedRef.current = false;
        currentTeamIdRef.current = null;
      }
    };
    // Only reconnect when teamId, token, or user changes - not when callbacks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, token, user?.username]);

  // Initialize current user's area
  useEffect(() => {
    if (user && !userCodeAreas.has(user.username)) {
      setUserCodeAreas((prev) => {
        const newAreas = new Map(prev);
        newAreas.set(user.username, {
          userId: user.username,
          username: user.username,
          userRole: getUserRole(),
          code: '',
          isEditable: true,
        });
        return newAreas;
      });
    }
  }, [user, userCodeAreas, getUserRole]);

  const handleCodeChange = useCallback((userId: string, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    const selectionStart = e.target.selectionStart;
    const lines = newCode.split('\n');
    let currentLine = 1;
    let currentPos = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length + 1 > selectionStart) {
        currentLine = i + 1;
        currentPos = selectionStart - currentPos;
        break;
      }
      currentPos += lines[i].length + 1;
    }

    // Update local code immediately
    updateUserCode(userId, newCode);
    
    // Send full code to server when user edits their area
    if (stompClientRef.current?.connected && user && userId === user.username) {
      const oldArea = userCodeAreas.get(userId);
      const oldCode = oldArea?.code || '';
      
      // Only send if code actually changed
      if (newCode !== oldCode) {
        const changeMessage = {
          type: 'REPLACE',
          teamId,
          lineNumber: 1, // Not used when sending full code, but kept for compatibility
          content: newCode, // Send full code instead of single line
          position: currentPos,
          userId: user.username,
        };
        console.log('Sending full code change to server, length:', newCode.length);
        stompClientRef.current.publish({
          destination: `/app/code/change/${teamId}`,
          body: JSON.stringify(changeMessage),
        });
      }
    }
  }, [userCodeAreas, user, teamId, updateUserCode]);

  // Get role display name
  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'CURATOR': return 'Куратор';
      case 'ELDER': return 'Староста';
      case 'STUDENT': return 'Студент';
      default: return role;
    }
  };

  // Sort areas: elder first, then curator, then students
  const sortedAreas = Array.from(userCodeAreas.values()).sort((a, b) => {
    const roleOrder: Record<string, number> = { ELDER: 1, CURATOR: 2, STUDENT: 3 };
    const aOrder = roleOrder[a.userRole] || 99;
    const bOrder = roleOrder[b.userRole] || 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.username.localeCompare(b.username);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <strong>Команда {teamId}</strong>
        {isElder && <span className={styles.elder}>Староста</span>}
        {isCurator && <span className={styles.curator}>Куратор</span>}
      </div>
      <div className={styles.areasContainer}>
        {sortedAreas.length === 0 ? (
          <div className={styles.noAreasMessage}>Нет активных участников</div>
        ) : (
          sortedAreas.map((area) => (
            <div key={area.userId} className={styles.codeArea}>
              <div className={styles.areaHeader}>
                <span className={styles.areaTitle}>
                  {area.username} {area.userId === user?.username && '(Вы)'}
                </span>
                <span className={styles.areaRole}>{getRoleDisplayName(area.userRole)}</span>
                {area.isEditable && <span className={styles.editableBadge}>Редактируемая</span>}
              </div>
              <textarea
                ref={(el) => {
                  if (el) {
                    textareaRefs.current.set(area.userId, el);
                  } else {
                    textareaRefs.current.delete(area.userId);
                  }
                }}
                value={area.code}
                onChange={(e) => handleCodeChange(area.userId, e)}
                readOnly={!area.isEditable}
                className={`${styles.textarea} ${area.isEditable ? styles.editable : styles.readOnly}`}
                placeholder={area.isEditable ? "Начните писать код..." : "Область другого участника"}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
