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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coin_address, title, body: content } = body;

    // Validate required fields
    if (!coin_address || !title || !content) {
      return NextResponse.json(
        { error: 'coin_address, title, and body are required' },
        { status: 400 }
      );
    }

    const db = await open({
      filename: './data/content.db',
      driver: sqlite3.Database,
    });

    // Check if content already exists for this token
    const existingContent = await db.get(
      'SELECT id FROM content WHERE coin_address = ?',
      [coin_address.toLowerCase()]
    );

    if (existingContent) {
      await db.close();
      return NextResponse.json(
        { error: 'Content already exists for this token address' },
        { status: 409 }
      );
    }

    // Insert new content
    const result = await db.run(
      'INSERT INTO content (coin_address, title, body) VALUES (?, ?, ?)',
      [coin_address.toLowerCase(), title, content]
    );

    await db.close();

    return NextResponse.json({
      success: true,
      id: result.lastID,
      coin_address: coin_address.toLowerCase(),
      title,
      body: content,
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}