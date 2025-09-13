/**
 * Middleware utilities for authentication and authorization.
 */
import { NextRequest } from 'next/server';
import { verifyToken, User } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

// Middleware to check authentication.
export function requireAuth(
  request: NextRequest
): { user: User } | { error: string } {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return { error: 'Authentication required' };
  }

  const user = verifyToken(token);
  if (!user) {
    return { error: 'Invalid or expired token' };
  }

  return { user };
}

// Middleware to check admin role.
export function requireAdmin(
  request: NextRequest
): { user: User } | { error: string } {
  const authResult = requireAuth(request);

  if ('error' in authResult) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    return { error: 'Admin access required' };
  }

  return authResult;
}

// Check if user has permission for specific tool.
export function canUseTool(user: User, toolName: string): boolean {
  // Define tool permissions
  const toolPermissions: Record<string, string[]> = {
    admin: [
      'echo',
      'get_time',
      'get_weather',
      'list_files',
      'read_file',
      'web_search',
      'db_query',
      'db_schema',
      'db_samples',
    ],
    user: ['echo', 'get_time', 'get_weather', 'web_search'],
  };

  const allowedTools = toolPermissions[user.role] || [];
  return allowedTools.includes(toolName);
}

// Check if user has permission for specific resource.
export function canAccessResource(user: User, resourceUri: string): boolean {
  // Define resource permissions.
  const resourcePermissions: Record<string, string[]> = {
    admin: [
      'docs://mcp-overview',
      'docs://tool-development',
      'docs://best-practices',
      'api://weather-endpoints',
      'api://database-schema',
      'config://server-settings',
      'config://tool-registry',
    ],
    user: [
      'docs://mcp-overview',
      'docs://tool-development',
      'docs://best-practices',
      'api://weather-endpoints',
    ],
  };

  const allowedResources = resourcePermissions[user.role] || [];
  return allowedResources.includes(resourceUri);
}
