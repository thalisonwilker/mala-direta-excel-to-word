import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function sanitizeFilename(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function parseData(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line) => {
    const separatorMatch = line.match(/^(\d+)\s*[-–—\t]+\s*(.+)$/);
    if (separatorMatch) {
      return { numero: separatorMatch[1].trim(), paroquia: separatorMatch[2].trim() };
    }

    const tabMatch = line.split('\t');
    if (tabMatch.length >= 2) {
      return { numero: tabMatch[0].trim(), paroquia: tabMatch[1].trim() };
    }

    const parts = line.split(/\s+/);
    if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
      return { numero: parts[0], paroquia: parts.slice(1).join(' ') };
    }

    return null;
  }).filter(Boolean);
}

export async function generateDocuments(templateBuffer, entries, onProgress) {
  const zip = new JSZip();
  const total = entries.length;

  for (let i = 0; i < total; i++) {
    const entry = entries[i];

    const pizzip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(pizzip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' },
    });

    doc.render({
      numero: entry.numero,
      paroquia: entry.paroquia,
    });

    const output = doc.getZip().generate({ type: 'arraybuffer' });
    const safeName = sanitizeFilename(entry.paroquia);
    const filename = `oficio_${entry.numero}_${safeName}.docx`;

    zip.file(filename, output);

    onProgress(((i + 1) / total) * 100);

    // yield to UI thread
    if (i % 10 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'oficios_mala_direta.zip');

  return total;
}
