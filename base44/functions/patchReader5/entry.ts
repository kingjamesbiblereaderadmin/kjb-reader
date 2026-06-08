import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as fs from 'node:fs';

Deno.serve(async (req) => {
  try {
    const filePath = '/src/pages/BibleReader.jsx';
    let content = fs.readFileSync(filePath, 'utf8');

    const findStr = `    // Clear gospel stepper on manual navigation
    setGospelMode(false);
    clearGospelNav();
    // Save last reading position before navigating FROM daily verse or random chapter
    if ((fromDailyVerse || fromRandom) && pos.abbr && pos.chapter) {`;

    const replaceStr = `    // Clear gospel stepper on manual navigation
    setGospelMode(false);
    clearGospelNav();

    // Fix for race condition: save position synchronously before routerNavigate triggers route effects
    savePosition(newAbbr, newChapter, jumpVerse);

    // Save last reading position before navigating FROM daily verse or random chapter
    if ((fromDailyVerse || fromRandom) && pos.abbr && pos.chapter) {`;

    if (!content.includes(findStr)) {
      return Response.json({ success: false, error: 'Find string not found in BibleReader.jsx' });
    }

    content = content.replace(findStr, replaceStr);

    // Increment worker version to cache bust
    const swPath = '/src/public/sw.js';
    if (fs.existsSync(swPath)) {
      let swContent = fs.readFileSync(swPath, 'utf8');
      const vMatch = swContent.match(/CACHE_VERSION = 'v(\d+)'/);
      if (vMatch) {
        const nextV = parseInt(vMatch[1], 10) + 1;
        swContent = swContent.replace(`CACHE_VERSION = 'v${vMatch[1]}'`, `CACHE_VERSION = 'v${nextV}'`);
        fs.writeFileSync(swPath, swContent, 'utf8');
      }
    }

    const settingsPath = '/src/pages/SettingsPage.jsx';
    if (fs.existsSync(settingsPath)) {
      let setContent = fs.readFileSync(settingsPath, 'utf8');
      const vMatch = setContent.match(/WORKER_VERSION = 'v([0-9_]+)'/);
      if (vMatch) {
        const parts = vMatch[1].split('_');
        const nextV = parts[0] + '_' + (parseInt(parts[1], 10) + 1);
        setContent = setContent.replace(`WORKER_VERSION = 'v${vMatch[1]}'`, `WORKER_VERSION = 'v${nextV}'`);
        fs.writeFileSync(settingsPath, setContent, 'utf8');
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
});