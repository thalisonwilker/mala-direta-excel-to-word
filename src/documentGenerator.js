import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

function sanitizeFilename(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderFilenamePattern(pattern, data, index) {
  if (!pattern || !pattern.trim()) {
    return `documento_${index + 1}`;
  }

  const rendered = pattern.replace(/\{([^}]+)\}/g, (_, tagName) => {
    const value = data[tagName.trim()];
    return value == null ? '' : String(value);
  });

  const normalized = sanitizeFilename(rendered);
  return normalized || `documento_${index + 1}`;
}

/**
 * Extract all {tag} placeholders from a .docx template buffer.
 */
export function extractTemplateTags(templateBuffer) {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  const tags = doc.getFullText().match(/\{([^}]+)\}/g);
  if (!tags) return [];

  const unique = [...new Set(tags.map((t) => t.slice(1, -1).trim()))];
  return unique;
}

/**
 * Parse an Excel file buffer and return { headers, rows }.
 * rows is an array of objects keyed by header name.
 */
export function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (json.length === 0) return { headers: [], rows: [] };

  const headers = Object.keys(json[0]);
  return { headers, rows: json };
}

/**
 * Generate documents using a field mapping.
 * @param {ArrayBuffer} templateBuffer - the .docx model
 * @param {object[]} rows - data rows from Excel
 * @param {object} fieldMap - { templateTag: excelColumn, ... }
 * @param {string} filenamePattern - filename pattern using Word tags
 * @param {function} onProgress - progress callback (0-100)
 */
export async function generateDocuments(templateBuffer, rows, fieldMap, filenamePattern, onProgress) {
  const zip = new JSZip();
  const total = rows.length;

  for (let i = 0; i < total; i++) {
    const row = rows[i];

    const data = {};
    for (const [tag, col] of Object.entries(fieldMap)) {
      data[tag] = col ? String(row[col] ?? '') : '';
    }

    const pizzip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(pizzip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' },
    });

    doc.render(data);

    const output = doc.getZip().generate({ type: 'arraybuffer' });

    const filenameBase = renderFilenamePattern(filenamePattern, data, i);
    const filename = `${filenameBase}.docx`;

    zip.file(filename, output);
    onProgress(((i + 1) / total) * 100);

    if (i % 10 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'lote_documentos.zip');

  return total;
}
