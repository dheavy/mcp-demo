import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from './auth';
import { getAllTools, executeTool } from '../mcp-server/tools';
import { getAllResources, initializeResources } from '../mcp-server/resources';
import { getResourceContent } from '../mcp-server/resources/content';

// Import tools to register them
import '../mcp-server/tools/weather';
import '../mcp-server/tools/filesystem';
import '../mcp-server/tools/search';
import '../mcp-server/tools/database';

// Initialize resources
initializeResources();

// Register basic tools
import { registerTool } from '../mcp-server/tools/index';

registerTool({
  name: 'echo',
  description: 'Echo back a message',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to echo back',
      },
    },
  },
  handler: async (args: Record<string, any>) => ({
    content: [
      {
        type: 'text',
        text: `Echo: ${args.message || 'Hello from MCP!'}`,
      },
    ],
  }),
});

registerTool({
  name: 'get_time',
  description: 'Get the current time',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => ({
    content: [
      {
        type: 'text',
        text: `Current time: ${new Date().toISOString()}`,
      },
    ],
  }),
});

export interface MCPWebSocketMessage {
  id: string;
  type: 'mcp_request' | 'mcp_response' | 'error' | 'ping' | 'pong';
  method?: string;
  params?: any;
  result?: any;
  error?: string;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
}

export class MCPWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  public setup(server: any) {
    if (this.wss) {
      return this.wss;
    }

    this.wss = new WebSocketServer({
      server,
      path: '/ws/mcp',
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    return this.wss;
  }

  private async handleConnection(
    ws: AuthenticatedWebSocket,
    request: IncomingMessage
  ) {
    console.log('New WebSocket connection attempt');

    // Extract token from query parameters, headers, or cookies.
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    let token =
      url.searchParams.get('token') ||
      request.headers.authorization?.replace('Bearer ', '');

    // If no token in query/header, try to extract from cookies
    if (!token && request.headers.cookie) {
      const cookies = request.headers.cookie
        .split(';')
        .reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
      token = cookies['auth-token'];
    }

    if (!token) {
      ws.send(
        JSON.stringify({
          id: 'auth-error',
          type: 'error',
          error: 'Authentication token required',
        })
      );
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = verifyToken(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }
      ws.userId = decoded.id.toString();
      ws.userRole = decoded.role;

      const clientId = `${ws.userId}-${Date.now()}`;
      this.clients.set(clientId, ws);

      console.log(
        `Authenticated WebSocket client: ${ws.userId} (${ws.userRole})`
      );

      // Send welcome message.
      ws.send(
        JSON.stringify({
          id: 'welcome',
          type: 'mcp_response',
          result: {
            message: 'Connected to MCP WebSocket server',
            userId: ws.userId,
            role: ws.userRole,
            availableTools: getAllTools().length,
            availableResources: getAllResources().length,
          },
        })
      );
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      ws.send(
        JSON.stringify({
          id: 'auth-error',
          type: 'error',
          error: 'Invalid authentication token',
        })
      );
      ws.close(1008, 'Authentication failed');
      return;
    }

    ws.on('message', data => {
      this.handleMessage(ws, data.toString());
    });

    ws.on('close', () => {
      // Remove client from map.
      for (const [clientId, client] of this.clients.entries()) {
        if (client === ws) {
          this.clients.delete(clientId);
          break;
        }
      }
      console.log(`WebSocket client disconnected: ${ws.userId}`);
    });

    ws.on('error', error => {
      console.error('WebSocket error:', error);
    });

    // Send periodic ping to keep connection alive.
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            id: 'ping',
            type: 'ping',
            timestamp: Date.now(),
          })
        );
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: string) {
    try {
      const parsed: MCPWebSocketMessage = JSON.parse(message);

      // Handle pong responses.
      if (parsed.type === 'pong') {
        return;
      }

      // Handle MCP requests.
      if (parsed.type === 'mcp_request' && parsed.method) {
        await this.handleMCPRequest(ws, parsed);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(
        JSON.stringify({
          id: 'parse-error',
          type: 'error',
          error: 'Invalid message format',
        })
      );
    }
  }

  private async handleMCPRequest(
    ws: AuthenticatedWebSocket,
    message: MCPWebSocketMessage
  ) {
    const { id, method, params } = message;

    try {
      let result: any;

      switch (method) {
        case 'tools/list':
          result = { tools: getAllTools() };
          break;

        case 'resources/list':
          result = { resources: getAllResources() };
          break;

        case 'resources/read':
          if (!params?.uri) {
            throw new Error('Resource URI is required');
          }
          const content = await getResourceContent(params.uri);
          result = { content };
          break;

        case 'tools/call':
          if (!params?.name) {
            throw new Error('Tool name is required');
          }
          const toolResult = await executeTool(
            params.name,
            params.arguments || {}
          );
          result = {
            content: toolResult.content,
            isError: toolResult.isError || false,
          };
          break;

        default:
          throw new Error(`Unknown MCP method: ${method}`);
      }

      ws.send(
        JSON.stringify({
          id,
          type: 'mcp_response',
          result,
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          id,
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  }

  // Broadcast message to all connected clients.
  public broadcast(message: any, excludeUserId?: string) {
    const messageStr = JSON.stringify(message);

    for (const [clientId, client] of this.clients.entries()) {
      if (
        client.readyState === WebSocket.OPEN &&
        client.userId !== excludeUserId
      ) {
        client.send(messageStr);
      }
    }
  }

  // Send message to specific user.
  public sendToUser(userId: string, message: any) {
    const messageStr = JSON.stringify(message);

    for (const [clientId, client] of this.clients.entries()) {
      if (client.readyState === WebSocket.OPEN && client.userId === userId) {
        client.send(messageStr);
      }
    }
  }

  // Get connection stats.
  public getStats() {
    return {
      totalConnections: this.clients.size,
      connections: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        userId: client.userId,
        role: client.userRole,
        readyState: client.readyState,
      })),
    };
  }
}

// Global instance.
export const mcpWebSocketServer = new MCPWebSocketServer();
