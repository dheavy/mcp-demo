import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPServerConfig } from './types.js';
import { getAllTools, executeTool } from './tools/index';
import { getAllResources, initializeResources } from './resources/index';
import { getResourceContent } from './resources/content';

// Import tools to register them.
import './tools/weather';
import './tools/filesystem';
import './tools/search';
import './tools/database';

// Initialize resources
initializeResources();

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
    tools: getAllTools(),
  };
});

// List available resources.
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: getAllResources(),
  };
});

// Read a resource.
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const resource = getAllResources().find(r => r.uri === request.params.uri);
  if (!resource) {
    throw new Error(`Resource not found: ${request.params.uri}`);
  }

  const content = getResourceContent(request.params.uri);

  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType || 'text/plain',
        text: content,
      },
    ],
  };
});

// Handle tool calls:
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    const result = await executeTool(name, args || {});
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

// Register basic tools.
import { registerTool } from './tools/index';

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
