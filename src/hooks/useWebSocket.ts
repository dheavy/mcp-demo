import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface MCPWebSocketMessage {
  id: string;
  type: 'mcp_request' | 'mcp_response' | 'error' | 'ping' | 'pong';
  method?: string;
  params?: any;
  result?: any;
  error?: string;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: MCPWebSocketMessage | null;
}

export function useWebSocket() {
  const { user } = useAuth();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlersRef = useRef<
    Map<string, (message: MCPWebSocketMessage) => void>
  >(new Map());

  const connect = useCallback(async () => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/mcp`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
      };

      ws.onmessage = event => {
        try {
          const message: MCPWebSocketMessage = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: message }));

          // Handle pong responses.
          if (message.type === 'pong') {
            return;
          }

          // Call registered message handlers.
          if (message.id && messageHandlersRef.current.has(message.id)) {
            const handler = messageHandlersRef.current.get(message.id);
            if (handler) {
              handler(message);
              messageHandlersRef.current.delete(message.id);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = event => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        // Attempt to reconnect after a delay.
        if (event.code !== 1000 && user) {
          // Don't reconnect if closed normally.
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = error => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false,
        }));
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
        isConnecting: false,
      }));
    }
  }, [user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }));
  }, []);

  const sendMessage = useCallback(
    (
      message: Omit<MCPWebSocketMessage, 'id'>
    ): Promise<MCPWebSocketMessage> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket is not connected'));
          return;
        }

        const id = `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const fullMessage: MCPWebSocketMessage = { ...message, id };

        // Register handler for response.
        messageHandlersRef.current.set(id, response => {
          if (response.type === 'error') {
            reject(new Error(response.error || 'Unknown error'));
          } else {
            resolve(response);
          }
        });

        // Send message.
        wsRef.current.send(JSON.stringify(fullMessage));

        // Set timeout for response.
        setTimeout(() => {
          if (messageHandlersRef.current.has(id)) {
            messageHandlersRef.current.delete(id);
            reject(new Error('Request timeout'));
          }
        }, 30000); // 30 second timeout
      });
    },
    []
  );

  // Auto-connect when user is available.
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
  };
}
