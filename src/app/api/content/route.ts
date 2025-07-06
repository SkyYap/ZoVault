import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('address');

  if (!tokenAddress) {
    return NextResponse.json(
      { error: 'Token address is required' },
      { status: 400 }
    );
  }

  try {
    const db = await open({
      filename: './data/content.db',
      driver: sqlite3.Database,
    });

    const content = await db.get(
      'SELECT * FROM content WHERE coin_address = ? LIMIT 1',
      [tokenAddress.toLowerCase()]
    );

    await db.close();

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found for this token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title: content.title,
      body: content.body,
      tokenAddress: content.coin_address,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
} 