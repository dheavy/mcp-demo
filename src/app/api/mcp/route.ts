import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/mcp-server/server';

export async function GET() {
  try {
    return NextResponse.json({
      message: 'MCP Server is running',
      config: {
        name: config.name,
        version: config.version,
        toolsCount: config.tools.length,
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
          tools: config.tools,
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

        // Simulate tool execution
        const result = await simulateToolCall(
          params.name,
          params.arguments || {}
        );
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

// Simulate tool execution (we'll replace this with real tool handlers later)
async function simulateToolCall(name: string, args: Record<string, any>) {
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
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
}
