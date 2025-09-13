import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/mcp-server/server';
import { getAllTools, executeTool, getToolCount } from '@/mcp-server/tools';
import { getAllResources, getResourceCount } from '@/mcp-server/resources';
import { getResourceContent } from '@/mcp-server/resources/content';

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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get MCP server status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params } = body;

    switch (method) {
      case 'tools/list':
        return NextResponse.json({
          tools: getAllTools(),
        });

      case 'resources/list':
        return NextResponse.json({
          resources: getAllResources(),
        });

      case 'resources/read':
        if (!params || !params.uri) {
          return NextResponse.json(
            { error: 'Resource URI is required' },
            { status: 400 }
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
        } catch (error) {
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process MCP request' },
      { status: 500 }
    );
  }
}
