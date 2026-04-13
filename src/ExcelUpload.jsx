import { useCallback, useRef, useState } from 'react';
import { parseExcel } from './documentGenerator';

export default function ExcelUpload({ onParsed }) {
  const [fileName, setFileName] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const { headers, rows } = parseExcel(e.target.result);
        setRowCount(rows.length);
        onParsed({ headers, rows });
      };
      reader.readAsArrayBuffer(file);
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer rounded-2xl border border-dashed border-violet-400/40 bg-[#140923] p-8 text-center transition hover:border-violet-300 hover:bg-[#1a0d2f]"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/15">
        <svg className="h-7 w-7 text-violet-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>

      {fileName ? (
        <div>
          <p className="text-sm font-medium text-violet-100">✓ {fileName}</p>
          <p className="mt-1 text-xs text-violet-200">{rowCount} linha(s) de dados</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-100">
            Arraste a planilha <span className="font-semibold text-violet-200">.xlsx</span> aqui
          </p>
          <p className="mt-1 text-xs text-slate-400">ou clique para selecionar (.xlsx, .xls, .csv)</p>
        </>
      )}
    </div>
  );
}
