import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function initDB() {
  const db = await open({
    filename: './data/content.db',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coin_address TEXT NOT NULL,
      title TEXT,
      body TEXT
    );
  `);

  // Example content for a coin
  await db.run(`
    INSERT INTO content (coin_address, title, body)
    VALUES (
      '0xd90af9670eb73e3aba8176a5aeabfb9c280af930',
      'SCP-042: The Singing Forest',
      'This is the secret classified content that is only visible to holders of this coin.'
    );
  `);

  console.log('✅ Database initialized and seeded.');
  await db.close();
}

initDB();
