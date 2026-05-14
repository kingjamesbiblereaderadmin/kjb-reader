import initSqlJs from 'npm:sql.js@1.12.0';

const DB_URL = 'https://www.bibleprotector.com/KJV-PCE.db';

// In-memory DB and chapter cache — persists across requests in the same isolate
let sqlDb = null;
const chapterCache = {};

async function getDb() {
  if (sqlDb) return sqlDb;
  const res = await fetch(DB_URL);
  if (!res.ok) throw new Error(`Failed to fetch Bible DB: ${res.status}`);
  const buf = await res.arrayBuffer();
  const SQL = await initSqlJs();
  sqlDb = new SQL.Database(new Uint8Array(buf));
  return sqlDb;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action, book, chapter } = body;

    const db = await getDb();

    if (action === 'getChapter') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }

      const cacheKey = `${book}:${chapter}`;
      if (chapterCache[cacheKey]) {
        return Response.json({ verses: chapterCache[cacheKey] });
      }

      const stmt = db.prepare("SELECT Verse, VText FROM Bible WHERE BookName = ? AND Chapter = ? ORDER BY CAST(Verse AS INTEGER)");
      stmt.bind([book, String(chapter)]);
      const verses = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        verses.push({ verse: parseInt(row.Verse, 10), text: row.VText });
      }
      stmt.free();

      if (!verses.length) {
        return Response.json({ error: `No verses found for ${book} ${chapter}` }, { status: 404 });
      }

      chapterCache[cacheKey] = verses;
      return Response.json({ verses });
    }

    if (action === 'getVerseCount') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }

      const stmt = db.prepare("SELECT COUNT(*) as cnt FROM Bible WHERE BookName = ? AND Chapter = ?");
      stmt.bind([book, String(chapter)]);
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();
      return Response.json({ count: row.cnt || 0 });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});