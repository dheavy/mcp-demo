export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  tools: MCPTool[];
  resources: MCPResource[];
}
