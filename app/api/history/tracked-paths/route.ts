import { NextRequest, NextResponse } from 'next/server';
import { getAllTrackedPaths, addTrackedPath } from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API /api/history/tracked-paths');

export async function GET() {
  try {
    const paths = getAllTrackedPaths();
    return NextResponse.json({ trackedPaths: paths });
  } catch (error) {
    logger.error('Request failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracked paths' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: pathStr, label, directoryConfigId } = body;

    if (!pathStr || !label) {
      return NextResponse.json({ error: 'path and label are required' }, { status: 400 });
    }

    const trackedPath = addTrackedPath(pathStr, label, directoryConfigId);
    return NextResponse.json({ trackedPath }, { status: 201 });
  } catch (error) {
    logger.error('Request failed:', error);
    const message = (error as Error).message;
    if (message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'Path is already being tracked' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Failed to add tracked path' },
      { status: 500 }
    );
  }
}
