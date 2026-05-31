// Font options for Bible exports (PDF / Word / RTF).
//
// PDF (jsPDF) only ships three standard families — times (serif), helvetica
// (sans) and courier (mono). Embedding cursive/dyslexic TTFs would bloat the
// file by several MB, so for PDF those options fall back to the closest
// built-in. Word (.doc HTML) and RTF reference fonts by NAME, so the reader's
// system font is used — there we can name real cursive / dyslexic faces.
export const EXPORT_FONTS = [
  {
    id: 'serif',
    label: 'Serif',
    pdf: 'times',               // jsPDF built-in
    css: "'Times New Roman', Georgia, serif",
    rtf: 'Times New Roman',
  },
  {
    id: 'sans',
    label: 'Sans-serif',
    pdf: 'helvetica',
    css: "Arial, Helvetica, sans-serif",
    rtf: 'Arial',
  },
  {
    id: 'mono',
    label: 'Monospace',
    pdf: 'courier',
    css: "'Courier New', monospace",
    rtf: 'Courier New',
  },
  {
    id: 'cursive',
    label: 'Cursive',
    pdf: 'times',               // PDF has no cursive built-in → serif fallback
    css: "'Segoe Script', 'Brush Script MT', 'Comic Sans MS', cursive",
    rtf: 'Segoe Script',
  },
  {
    id: 'dyslexic',
    label: 'Dyslexic-friendly',
    pdf: 'helvetica',           // PDF fallback → sans
    css: "'OpenDyslexic', 'Comic Sans MS', 'Verdana', sans-serif",
    rtf: 'Comic Sans MS',
  },
  {
    id: 'legible',
    label: 'High-legibility',
    pdf: 'helvetica',           // PDF fallback → sans
    css: "'Atkinson Hyperlegible', 'Verdana', 'Tahoma', sans-serif",
    rtf: 'Verdana',
  },
];

export const DEFAULT_EXPORT_FONT = 'serif';

export function getExportFont(id) {
  return EXPORT_FONTS.find(f => f.id === id) || EXPORT_FONTS[0];
}