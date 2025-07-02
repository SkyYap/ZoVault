import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function GET() {
  try {
    const db = await open({
      filename: './data/content.db',
      driver: sqlite3.Database,
    });

    const content = await db.get(
      'SELECT * FROM content WHERE coin_address = ? LIMIT 1',
      ['0xe90af9670eb73e3aba8176a5aeabfb9c260af930']
    );

    await db.close();

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title: content.title,
      body: content.body,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
} 