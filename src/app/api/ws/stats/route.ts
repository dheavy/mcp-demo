import { NextResponse } from 'next/server';
import { mcpWebSocketServer } from '../../../../lib/websocket-server';

export async function GET() {
  try {
    const stats = mcpWebSocketServer.getStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: 'Failed to get WebSocket stats' },
      { status: 500 }
    );
  }
}
