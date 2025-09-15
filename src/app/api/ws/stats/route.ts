import { NextRequest, NextResponse } from 'next/server';
import { mcpWebSocketServer } from '../../../../lib/websocket-server';

export async function GET(request: NextRequest) {
  try {
    const stats = mcpWebSocketServer.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get WebSocket stats' },
      { status: 500 }
    );
  }
}
