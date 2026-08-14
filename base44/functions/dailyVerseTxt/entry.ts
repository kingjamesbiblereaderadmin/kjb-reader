// Returns today's KJB daily verse as plain text, auto-updating every day at
// midnight US Eastern (Washington) time. Point kingjamesbiblereader.com/
// dailyverse.txt at this function's URL.
//
// The selection logic lives in base44/shared/dailyVerse.ts so the daily verse
// here always matches the one pushed by sendDailyVersePush.

import { getDailyVerse } from '../../shared/dailyVerse.ts';

Deno.serve(async (_req) => {
  try {
    const verse = await getDailyVerse();

    // Plain-text body: date header, reference on its own line, verse on its own line.
    const body =
      `Daily Verse \u2014 ${verse.dateStr}\n` +
      `${verse.ref}\n` +
      `${verse.text}\n`;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // Cache for an hour at the edge; revalidates so the new day's verse
        // appears shortly after midnight Eastern.
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});