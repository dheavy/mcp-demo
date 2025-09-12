import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPToolResult, MCPServerConfig } from './types.js';

const config: MCPServerConfig = {
  name: 'ai-assistant-hub',
  version: '1.0.0',
  tools: [],
  resources: [],
};

// Initialize MCP Server.
const server = new Server(
  {
    name: config.name,
    version: config.version,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools.
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: config.tools,
  };
});

// List available resources.
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: config.resources,
  };
});

// Read a resource.
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const resource = config.resources.find(r => r.uri === request.params.uri);
  if (!resource) {
    throw new Error(`Resource not found: ${request.params.uri}`);
  }

  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType || 'text/plain',
        text: `Resource content for ${resource.name}`,
      },
    ],
  };
});

// Handle tool calls:
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    // We route to the appropriate tool handler.
    const result = await handleToolCall(name, args || {});
    return {
      content: result.content,
      isError: result.isError || false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
      isError: true,
    };
  }
});

async function handleToolCall(
  name: string,
  args: Record<string, any>
): Promise<MCPToolResult> {
  switch (name) {
    case 'echo':
      return {
        content: [
          {
            type: 'text',
            text: `Echo: ${args.message || 'Hello from MCP!'}`,
          },
        ],
      };

    case 'get_time':
      return {
        content: [
          {
            type: 'text',
            text: `Current time: ${new Date().toISOString()}`,
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Register tools
config.tools.push(
  {
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
  },
  {
    name: 'get_time',
    description: 'Get the current time',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  }
);

async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('MCP Server started successfully');
}

export { server, config, startServer };

// Start server if this file is run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(console.error);
}
