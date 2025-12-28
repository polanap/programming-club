import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { CodeChangeMessage, LockMessage, LineLock, AuthUser } from '../../types';
import styles from './CodeEditor.module.scss';

interface CodeEditorProps {
  teamId: number;
  taskId: number;
  isElder: boolean;
  isCurator: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ teamId, taskId, isElder, isCurator }) => {
  const [code, setCode] = useState<string>('');
  const [lockedLines, setLockedLines] = useState<Map<number, LineLock>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const userStr = localStorage.getItem('user');
  const user: AuthUser | null = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');

  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }
  }, []);

  const applyChange = useCallback((change: CodeChangeMessage) => {
    setCode((prevCode) => {
      const lines = prevCode.split('\n');
      const lineIndex = change.lineNumber - 1;
      
      if (lineIndex < 0 || lineIndex >= lines.length) return prevCode;
      
      let line = lines[lineIndex];
      switch (change.type) {
        case 'INSERT':
          const pos = change.position || line.length;
          lines[lineIndex] = line.substring(0, pos) + change.content + line.substring(pos);
          break;
        case 'DELETE':
          const delPos = change.position || 0;
          const length = change.content?.length || 1;
          lines[lineIndex] = line.substring(0, delPos) + line.substring(delPos + length);
          break;
        case 'REPLACE':
          lines[lineIndex] = change.content || '';
          break;
        default:
          return prevCode;
      }
      return lines.join('\n');
    });
  }, []);

  const updateLockedLines = useCallback((lock: LockMessage) => {
    setLockedLines((prev) => {
      const newLocks = new Map(prev);
      if (lock.action === 'LOCK') {
        newLocks.set(lock.lineNumber, {
          userId: lock.userId,
          userRole: lock.userRole,
        });
      } else if (lock.action === 'UNLOCK') {
        newLocks.delete(lock.lineNumber);
      }
      return newLocks;
    });
  }, []);

  const calculateDiff = useCallback((oldCode: string, newCode: string, line: number, pos: number): { type: 'INSERT' | 'DELETE', content: string } | null => {
    // Simplified diff calculation
    // In production, use a proper diff algorithm (e.g., Operational Transformation or CRDT)
    if (newCode.length > oldCode.length) {
      return {
        type: 'INSERT',
        content: newCode.substring(oldCode.length),
      };
    } else if (newCode.length < oldCode.length) {
      return {
        type: 'DELETE',
        content: oldCode.substring(newCode.length),
      };
    }
    return null;
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!token || !user) return;

    const socket = new SockJS('http://localhost:8181/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log('WebSocket connected');
        
        // Sync code on connect
        client.publish({
          destination: `/app/sync/${teamId}`,
          body: JSON.stringify({ teamId }),
        });

        // Subscribe to code changes
        client.subscribe(`/topic/code/change/${teamId}`, (message: IMessage) => {
          const change: CodeChangeMessage = JSON.parse(message.body);
          if (change.userId !== user.username) {
            applyChange(change);
          }
        });

        // Subscribe to cursor positions
        client.subscribe(`/topic/cursor/${teamId}`, (message: IMessage) => {
          // Update cursor visualization (simplified)
          // const pos = JSON.parse(message.body);
        });

        // Subscribe to line locks
        client.subscribe(`/topic/lock/${teamId}`, (message: IMessage) => {
          const lock: LockMessage = JSON.parse(message.body);
          updateLockedLines(lock);
        });

        // Subscribe to code sync
        const username = user?.username || 'user';
        client.subscribe(`/user/${username}/queue/code/sync`, (message: IMessage) => {
          const sync = JSON.parse(message.body);
          setCode(sync.code || '');
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [teamId, token, user, applyChange, updateLockedLines]);

  useEffect(() => {
    if (teamId) {
      connectWebSocket();
    }
    return () => {
      disconnectWebSocket();
    };
  }, [teamId, connectWebSocket, disconnectWebSocket]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    // currentLine and currentPos are used for lock checking and diff calculation below

    // Check if line is locked
    const lock = lockedLines.get(currentLine);
    if (lock && lock.userId !== user?.username && user) {
      e.preventDefault();
      return;
    }

    // Send change to server
    const oldCode = code;
    const diff = calculateDiff(oldCode, newCode, currentLine, currentPos);
    
    if (diff && stompClientRef.current?.connected && user) {
      stompClientRef.current.publish({
        destination: `/app/code/change/${teamId}`,
        body: JSON.stringify({
          type: diff.type,
          teamId,
          lineNumber: currentLine,
          content: diff.content,
          position: currentPos,
          userId: user.username,
        }),
      });
    }

    setCode(newCode);
  }, [code, lockedLines, user, teamId, calculateDiff]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <strong>Команда {teamId}</strong>
        {isElder && <span className={styles.elder}>Староста</span>}
        {isCurator && <span className={styles.curator}>Куратор</span>}
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleCodeChange}
        className={styles.textarea}
        placeholder="Начните писать код..."
      />
    </div>
  );
};

export default CodeEditor;

