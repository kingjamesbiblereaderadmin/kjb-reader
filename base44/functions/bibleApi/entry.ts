import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import initSqlJs from 'npm:sql.js@1.12.0';

const DB_URL = 'https://www.bibleprotector.com/KJV-PCE.db';

// In-memory DB and chapter cache — persists across requests in the same isolate
let sqlDb = null;
const chapterCache = {};

const BOOK_NUMS = {
  'Genesis':1,'Exodus':2,'Leviticus':3,'Numbers':4,'Deuteronomy':5,
  'Joshua':6,'Judges':7,'Ruth':8,'1 Samuel':9,'2 Samuel':10,
  '1 Kings':11,'2 Kings':12,'1 Chronicles':13,'2 Chronicles':14,
  'Ezra':15,'Nehemiah':16,'Esther':17,'Job':18,'Psalms':19,'Proverbs':20,
  'Ecclesiastes':21,'Song of Solomon':22,'Isaiah':23,'Jeremiah':24,
  'Lamentations':25,'Ezekiel':26,'Daniel':27,'Hosea':28,'Joel':29,
  'Amos':30,'Obadiah':31,'Jonah':32,'Micah':33,'Nahum':34,
  'Habakkuk':35,'Zephaniah':36,'Haggai':37,'Zechariah':38,'Malachi':39,
  'Matthew':40,'Mark':41,'Luke':42,'John':43,'Acts':44,'Romans':45,
  '1 Corinthians':46,'2 Corinthians':47,'Galatians':48,'Ephesians':49,
  'Philippians':50,'Colossians':51,'1 Thessalonians':52,'2 Thessalonians':53,
  '1 Timothy':54,'2 Timothy':55,'Titus':56,'Philemon':57,'Hebrews':58,
  'James':59,'1 Peter':60,'2 Peter':61,'1 John':62,'2 John':63,
  '3 John':64,'Jude':65,'Revelation':66
};

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

    const bookNum = BOOK_NUMS[book];
    if (!bookNum) {
      return Response.json({ error: `Book "${book}" not found` }, { status: 404 });
    }

    const db = await getDb();

    if (action === 'schema') {
      const stmt = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'");
      const tables = [];
      while (stmt.step()) {
        tables.push(stmt.getAsObject());
      }
      stmt.free();
      // Also get first row of first table
      let sample = [];
      try {
        const s2 = db.prepare("SELECT * FROM bible LIMIT 3");
        while (s2.step()) { sample.push(s2.getAsObject()); }
        s2.free();
      } catch {}
      return Response.json({ tables, sample });
    }

    if (action === 'getChapter') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }

      const cacheKey = `${book}:${chapter}`;
      if (chapterCache[cacheKey]) {
        return Response.json({ verses: chapterCache[cacheKey] });
      }

      const stmt = db.prepare("SELECT v, t FROM bible WHERE b = ? AND c = ? ORDER BY v");
      stmt.bind([bookNum, chapter]);
      const verses = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        verses.push({ verse: row.v, text: row.t });
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

      const stmt = db.prepare("SELECT COUNT(*) as cnt FROM bible WHERE b = ? AND c = ?");
      stmt.bind([bookNum, chapter]);
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