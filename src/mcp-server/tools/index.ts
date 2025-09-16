/**
 * Tool Registration System.
 */
import { MCPTool, MCPToolResult } from '../types';

export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: MCPTool['inputSchema'];
  handler: (args: Record<string, unknown>) => Promise<MCPToolResult>;
}

// Tool registry.
const tools: Map<string, ToolHandler> = new Map();

export function registerTool(tool: ToolHandler): void {
  tools.set(tool.name, tool);
}

export function getAllTools(): MCPTool[] {
  return Array.from(tools.values()).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  const tool = tools.get(name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  return await tool.handler(args);
}

export function hasTool(name: string): boolean {
  return tools.has(name);
}

export function getToolCount(): number {
  return tools.size;
}
