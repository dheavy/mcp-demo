import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/mcp-server/server';
import { getAllTools, executeTool, getToolCount } from '@/mcp-server/tools';
import { getAllResources, getResourceCount } from '@/mcp-server/resources';
import { getResourceContent } from '@/mcp-server/resources/content';
import { requireAuth, canUseTool, canAccessResource } from '@/lib/middleware';

export async function GET() {
  try {
    return NextResponse.json({
      message: 'MCP Server is running',
      config: {
        name: config.name,
        version: config.version,
        toolsCount: getToolCount(),
        resourcesCount: getResourceCount(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to get MCP server status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication.
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const user = authResult.user;
    const body = await request.json();
    const { method, params } = body;

    switch (method) {
      case 'tools/list':
        // Filter tools based on user permissions.
        const allTools = getAllTools();
        const allowedTools = allTools.filter(tool =>
          canUseTool(user, tool.name)
        );

        return NextResponse.json({
          tools: allowedTools,
        });

      case 'resources/list':
        // Filter resources based on user permissions.
        const allResources = getAllResources();
        const allowedResources = allResources.filter(resource =>
          canAccessResource(user, resource.uri)
        );

        return NextResponse.json({
          resources: allowedResources,
        });

      case 'resources/read':
        if (!params || !params.uri) {
          return NextResponse.json(
            { error: 'Resource URI is required' },
            { status: 400 }
          );
        }

        // Check resource access permission.
        if (!canAccessResource(user, params.uri)) {
          return NextResponse.json(
            { error: 'Access denied to this resource' },
            { status: 403 }
          );
        }

        try {
          const content = getResourceContent(params.uri);
          return NextResponse.json({
            contents: [
              {
                uri: params.uri,
                mimeType: 'text/plain',
                text: content,
              },
            ],
          });
        } catch {
          return NextResponse.json(
            { error: `Resource not found: ${params.uri}` },
            { status: 404 }
          );
        }

      case 'tools/call':
        if (!params || !params.name) {
          return NextResponse.json(
            { error: 'Tool name is required' },
            { status: 400 }
          );
        }

        // Check tool access permission.
        if (!canUseTool(user, params.name)) {
          return NextResponse.json(
            { error: 'Access denied to this tool' },
            { status: 403 }
          );
        }

        const result = await executeTool(params.name, params.arguments || {});
        return NextResponse.json({
          content: result.content,
          isError: result.isError || false,
        });

      default:
        return NextResponse.json(
          { error: `Unknown method: ${method}` },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to process MCP request' },
      { status: 500 }
    );
  }
}
