import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const CodeEditor = ({ teamId, taskId, isElder, isCurator }) => {
  const [code, setCode] = useState('');
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorPos, setCursorPos] = useState(0);
  const [lockedLines, setLockedLines] = useState(new Map());
  const [connectedUsers, setConnectedUsers] = useState([]);
  const textareaRef = useRef(null);
  const stompClientRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (teamId) {
      connectWebSocket();
    }
    return () => {
      disconnectWebSocket();
    };
  }, [teamId]);

  const connectWebSocket = () => {
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
        client.subscribe(`/topic/code/change/${teamId}`, (message) => {
          const change = JSON.parse(message.body);
          if (change.userId !== user.username) {
            applyChange(change);
          }
        });

        // Subscribe to cursor positions
        client.subscribe(`/topic/cursor/${teamId}`, (message) => {
          const pos = JSON.parse(message.body);
          // Update cursor visualization (simplified)
        });

        // Subscribe to line locks
        client.subscribe(`/topic/lock/${teamId}`, (message) => {
          const lock = JSON.parse(message.body);
          updateLockedLines(lock);
        });

        // Subscribe to code sync
        const username = user?.username || 'user';
        client.subscribe(`/user/${username}/queue/code/sync`, (message) => {
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
  };

  const disconnectWebSocket = () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }
  };

  const applyChange = (change) => {
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
  };

  const updateLockedLines = (lock) => {
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
  };

  const handleCodeChange = (e) => {
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

    setCursorLine(currentLine);
    setCursorPos(currentPos);

    // Check if line is locked
    const lock = lockedLines.get(currentLine);
    if (lock && lock.userId !== user.username) {
      e.preventDefault();
      return;
    }

    // Send change to server
    const oldCode = code;
    const diff = calculateDiff(oldCode, newCode, currentLine, currentPos);
    
    if (diff && stompClientRef.current?.connected) {
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
  };

  const calculateDiff = (oldCode, newCode, line, pos) => {
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
  };

  const handleLockLine = (lineNumber) => {
    if (stompClientRef.current?.connected) {
      const userRole = isCurator ? 'CURATOR' : isElder ? 'ELDER' : 'STUDENT';
      stompClientRef.current.publish({
        destination: `/app/lock/${teamId}`,
        body: JSON.stringify({
          teamId,
          lineNumber,
          action: 'LOCK',
          userId: user.username,
          userRole,
        }),
      });
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
        <strong>Команда {teamId}</strong>
        {isElder && <span style={{ marginLeft: '10px', color: 'green' }}>Староста</span>}
        {isCurator && <span style={{ marginLeft: '10px', color: 'blue' }}>Куратор</span>}
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleCodeChange}
        style={{
          flex: 1,
          width: '100%',
          fontFamily: 'monospace',
          fontSize: '14px',
          padding: '10px',
          border: 'none',
          resize: 'none',
          outline: 'none',
        }}
        placeholder="Начните писать код..."
      />
    </div>
  );
};

export default CodeEditor;
