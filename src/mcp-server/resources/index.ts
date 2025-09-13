/**
 * MCP Resource Management.
 */
import { MCPResource } from '../types';

// Resource registry.
const resources: Map<string, MCPResource> = new Map();

export function registerResource(resource: MCPResource): void {
  resources.set(resource.uri, resource);
}

export function getAllResources(): MCPResource[] {
  return Array.from(resources.values());
}

export function getResource(uri: string): MCPResource | undefined {
  return resources.get(uri);
}

export function hasResource(uri: string): boolean {
  return resources.has(uri);
}

export function getResourceCount(): number {
  return resources.size;
}

export function initializeResources(): void {
  // Documentation resources
  registerResource({
    uri: 'docs://mcp-overview',
    name: 'MCP Overview',
    description: 'Introduction to Model Context Protocol',
    mimeType: 'text/markdown',
  });

  registerResource({
    uri: 'docs://tool-development',
    name: 'Tool Development Guide',
    description: 'How to develop MCP tools',
    mimeType: 'text/markdown',
  });

  registerResource({
    uri: 'docs://best-practices',
    name: 'MCP Best Practices',
    description: 'Best practices for MCP implementation',
    mimeType: 'text/markdown',
  });

  // API resources
  registerResource({
    uri: 'api://weather-endpoints',
    name: 'Weather API Endpoints',
    description: 'Available weather API endpoints and usage',
    mimeType: 'application/json',
  });

  registerResource({
    uri: 'api://database-schema',
    name: 'Database Schema',
    description: 'Complete database schema documentation',
    mimeType: 'application/json',
  });

  // Configuration resources
  registerResource({
    uri: 'config://server-settings',
    name: 'Server Configuration',
    description: 'Current server configuration and settings',
    mimeType: 'application/json',
  });

  registerResource({
    uri: 'config://tool-registry',
    name: 'Tool Registry',
    description: 'Registered tools and their configurations',
    mimeType: 'application/json',
  });
}
