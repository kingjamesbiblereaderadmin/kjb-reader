import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';

// Build a flat list of all verses from the Bible data
async function buildVerseIndex() {
  try {
    const bible = await getBibleData();
    const verses = [];
    
    for (const book of BIBLE_BOOKS) {
      const bookData = bible[book.name];
      if (!bookData) continue;
      
      for (const chapter in bookData) {
        const verseList = bookData[chapter];
        if (!Array.isArray(verseList)) continue;
        
        for (const verseObj of verseList) {
          verses.push({
            book: book.name,
            chapter: parseInt(chapter),
            verse: verseObj.verse,
            text: verseObj.text.replace(/\[([^\]]+)\]/g, '$1'),
            ref: `${book.name} ${chapter}:${verseObj.verse}`
          });
        }
      }
    }
    
    return verses;
  } catch (error) {
    console.error('Failed to build verse index:', error);
    return [];
  }
}

let verseIndexCache = null;

// Get verse of the day (same verse for entire day based on date)
export async function getDailyVerse() {
  if (!verseIndexCache) {
    verseIndexCache = await buildVerseIndex();
  }
  
  if (verseIndexCache.length === 0) {
    return { text: 'Unable to load verse', ref: 'Error' };
  }
  
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const idx = dayOfYear % verseIndexCache.length;
  
  return verseIndexCache[idx];
}