import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only batch import endpoint for ChapterAudio narration records.
// POST JSON: { "records": [ { book, book_order, chapter, audio_url, timing_url?, voice?, duration_seconds?, verse_count? }, ... ] }
// Upserts by book + chapter (updates an existing record if one already exists,
// otherwise creates). Returns { created, updated } on success.

const stripUndef = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    let body;
    try { body = await req.json(); } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const records = Array.isArray(body?.records) ? body.records : null;
    if (!records) return Response.json({ error: 'Missing "records" array' }, { status: 400 });

    // Validate + normalize each record. Only book, chapter, audio_url are
    // required; the rest are optional metadata.
    const clean = [];
    for (const r of records) {
      if (!r || typeof r.book !== 'string' || typeof r.chapter !== 'number' || typeof r.audio_url !== 'string' || !r.audio_url) {
        return Response.json({ error: 'Each record requires book (string), chapter (number), and audio_url (string)' }, { status: 400 });
      }
      clean.push(stripUndef({
        book: r.book,
        book_order: typeof r.book_order === 'number' ? r.book_order : undefined,
        chapter: r.chapter,
        audio_url: r.audio_url,
        timing_url: typeof r.timing_url === 'string' && r.timing_url ? r.timing_url : undefined,
        voice: typeof r.voice === 'string' ? r.voice : undefined,
        duration_seconds: typeof r.duration_seconds === 'number' ? r.duration_seconds : undefined,
        verse_count: typeof r.verse_count === 'number' ? r.verse_count : undefined,
      }));
    }
    if (!clean.length) return Response.json({ created: 0, updated: 0 });

    // Fetch only the existing records for the books in this batch so we can
    // upsert by book + chapter without loading the whole table.
    const books = [...new Set(clean.map((r) => r.book))];
    const existing = await base44.asServiceRole.entities.ChapterAudio.filter({ book: { $in: books } });
    const existingMap = new Map();
    for (const e of existing) {
      existingMap.set(`${e.book}|${e.chapter}`, e);
    }

    const toCreate = [];
    const toUpdate = [];
    for (const r of clean) {
      const ex = existingMap.get(`${r.book}|${r.chapter}`);
      if (ex) {
        toUpdate.push({ id: ex.id, ...r });
      } else {
        toCreate.push(r);
      }
    }

    let created = 0;
    let updated = 0;
    if (toCreate.length) {
      await base44.asServiceRole.entities.ChapterAudio.bulkCreate(toCreate);
      created = toCreate.length;
    }
    if (toUpdate.length) {
      await base44.asServiceRole.entities.ChapterAudio.bulkUpdate(toUpdate);
      updated = toUpdate.length;
    }

    return Response.json({ created, updated });
  } catch (error) {
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}