import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/mcp-server/server';
import { getAllTools, executeTool, getToolCount } from '@/mcp-server/tools';

export async function GET() {
  try {
    return NextResponse.json({
      message: 'MCP Server is running',
      config: {
        name: config.name,
        version: config.version,
        toolsCount: getToolCount(),
        resourcesCount: config.resources.length,
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
          resources: config.resources,
        });

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
