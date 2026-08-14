import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns the narration MP3 URL for a given book + chapter.
// Input  body: { book: "01_Genesis", chapter: 1 }
//   - `book` is the canonical audio key: zero-padded order + "_" + apiName
//     (e.g. "01_Genesis", "02_Exodus", "46_1 Corinthians"). We strip the
//     numeric prefix to get the apiName stored on ChapterAudio records.
//   - `chapter` is a plain integer.
// Output: { found: true, url, duration } | { found: false }
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const bookKey = String(body?.book || '');
    const chapter = Number(body?.chapter);

    if (!bookKey || !Number.isFinite(chapter) || chapter < 1) {
      return Response.json({ found: false, error: 'Invalid book or chapter' }, { status: 400 });
    }

    // "01_Genesis" -> "Genesis"
    const apiName = bookKey.replace(/^\d+_/, '');
    // ChapterAudio.chapter is stored as a number; query with the numeric value.
    const records = await base44.asServiceRole.entities.ChapterAudio.filter({
      book: apiName,
      chapter,
    });

    if (!records || records.length === 0) {
      return Response.json({ found: false });
    }

    const rec = records[0];
    if (!rec.audio_url) {
      return Response.json({ found: false });
    }

    return Response.json({
      found: true,
      url: rec.audio_url,
      duration: rec.duration_seconds ?? null,
    });
  } catch (error) {
    return Response.json({ found: false, error: error?.message || String(error) }, { status: 500 });
  }
}