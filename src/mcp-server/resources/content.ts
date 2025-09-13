/**
 * Resource Content Provider.
 */
import { MCPResource } from '../types';
import { getAllResources } from './index';

// Get content for a specific resource
export function getResourceContent(uri: string): string {
  const resource = getAllResources().find(r => r.uri === uri);
  if (!resource) {
    throw new Error(`Resource not found: ${uri}`);
  }

  switch (uri) {
    case 'docs://mcp-overview':
      return `# Model Context Protocol (MCP) Overview

The Model Context Protocol (MCP) is a standard for connecting AI models to external tools and data sources. It enables AI assistants to:

- **Execute Tools**: Call external functions and APIs
- **Access Resources**: Read files, databases, and other data sources
- **Maintain Context**: Keep track of conversations and state

## Key Concepts

### Tools
Tools are functions that AI models can call to perform actions:
- Weather lookup
- File operations
- Database queries
- Web searches

### Resources
Resources are data sources that AI models can read:
- Documentation
- Configuration files
- Database schemas
- API specifications

## Benefits

- **Standardized Interface**: Consistent way to connect AI to external systems
- **Security**: Controlled access to tools and resources
- **Extensibility**: Easy to add new capabilities
- **Interoperability**: Works across different AI models and platforms`;

    case 'docs://tool-development':
      return `# Tool Development Guide

## Creating MCP Tools

### 1. Tool Structure
\`\`\`typescript
import { registerTool } from './index';

registerTool({
  name: 'my_tool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of parameter'
      }
    },
    required: ['param1']
  },
  handler: async (args) => {
    // Tool implementation
    return {
      content: [{
        type: 'text',
        text: 'Tool result'
      }]
    };
  }
});
\`\`\`

### 2. Best Practices
- **Clear Descriptions**: Provide detailed descriptions for tools and parameters
- **Input Validation**: Always validate input parameters
- **Error Handling**: Return meaningful error messages
- **Security**: Validate paths and sanitize inputs
- **Performance**: Consider timeouts and resource limits`;

    case 'docs://best-practices':
      return `# MCP Best Practices

## Security
- **Input Validation**: Always validate and sanitize inputs
- **Path Security**: Prevent directory traversal attacks
- **Resource Limits**: Set reasonable limits on file sizes and execution time
- **Authentication**: Implement proper authentication for sensitive operations

## Performance
- **Async Operations**: Use async/await for I/O operations
- **Caching**: Cache frequently accessed data
- **Timeouts**: Set appropriate timeouts for external API calls
- **Resource Management**: Properly close database connections and file handles

## Error Handling
- **Graceful Failures**: Return meaningful error messages
- **Logging**: Log errors for debugging
- **User-Friendly Messages**: Provide clear error messages to users
- **Fallback Behavior**: Implement fallbacks when possible

## Tool Design
- **Single Responsibility**: Each tool should have a clear, single purpose
- **Consistent Interface**: Use consistent parameter naming and structure
- **Documentation**: Provide comprehensive documentation
- **Testing**: Write tests for your tools`;

    case 'api://weather-endpoints':
      return JSON.stringify(
        {
          endpoints: [
            {
              name: 'get_weather',
              method: 'POST',
              description: 'Get current weather for a location',
              parameters: {
                location: {
                  type: 'string',
                  required: true,
                  description: 'City or location name',
                },
              },
              example: {
                location: 'London',
              },
            },
          ],
          response_format: {
            content: [
              {
                type: 'text',
                text: 'Formatted weather information',
              },
            ],
            isError: false,
          },
        },
        null,
        2
      );

    case 'api://database-schema':
      return JSON.stringify(
        {
          tables: {
            users: {
              columns: {
                id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
                name: 'TEXT NOT NULL',
                email: 'TEXT UNIQUE NOT NULL',
                role: 'TEXT DEFAULT "user"',
                created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
              },
            },
            products: {
              columns: {
                id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
                name: 'TEXT NOT NULL',
                price: 'DECIMAL(10,2) NOT NULL',
                category: 'TEXT NOT NULL',
                stock: 'INTEGER DEFAULT 0',
                created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
              },
            },
            orders: {
              columns: {
                id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
                user_id: 'INTEGER NOT NULL',
                product_id: 'INTEGER NOT NULL',
                quantity: 'INTEGER NOT NULL',
                total: 'DECIMAL(10,2) NOT NULL',
                status: 'TEXT DEFAULT "pending"',
                created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
              },
              foreign_keys: {
                user_id: 'REFERENCES users(id)',
                product_id: 'REFERENCES products(id)',
              },
            },
          },
        },
        null,
        2
      );

    case 'config://server-settings':
      return JSON.stringify(
        {
          server: {
            name: 'ai-assistant-hub',
            version: '1.0.0',
            environment: 'development',
            port: 3000,
          },
          mcp: {
            max_tools: 50,
            max_resources: 100,
            timeout_ms: 30000,
          },
          security: {
            allowed_paths: [process.cwd()],
            max_file_size: '1MB',
            allowed_extensions: ['.txt', '.json', '.md', '.ts', '.js'],
          },
        },
        null,
        2
      );

    case 'config://tool-registry':
      return JSON.stringify(
        {
          tools: [
            {
              name: 'echo',
              description: 'Echo back a message',
              category: 'utility',
            },
            {
              name: 'get_time',
              description: 'Get the current time',
              category: 'utility',
            },
            {
              name: 'get_weather',
              description: 'Get current weather information',
              category: 'api',
            },
            {
              name: 'list_files',
              description: 'List files and directories',
              category: 'filesystem',
            },
            {
              name: 'read_file',
              description: 'Read file contents',
              category: 'filesystem',
            },
            {
              name: 'web_search',
              description: 'Search the web',
              category: 'api',
            },
            {
              name: 'db_query',
              description: 'Execute database queries',
              category: 'database',
            },
            {
              name: 'db_schema',
              description: 'Get database schema',
              category: 'database',
            },
            {
              name: 'db_samples',
              description: 'Get sample queries',
              category: 'database',
            },
          ],
          categories: {
            utility: 'Basic utility functions',
            api: 'External API integrations',
            filesystem: 'File system operations',
            database: 'Database operations',
          },
        },
        null,
        2
      );

    default:
      return `Resource content for ${resource.name}\n\nURI: ${uri}\nType: ${resource.mimeType}\nDescription: ${resource.description}`;
  }
}
