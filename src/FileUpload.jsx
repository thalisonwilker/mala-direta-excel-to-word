import { useCallback, useRef, useState } from 'react';

export default function FileUpload({ onFileLoaded }) {
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => onFileLoaded(e.target.result);
      reader.readAsArrayBuffer(file);
    },
    [onFileLoaded]
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
      className="cursor-pointer rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 p-8 text-center transition hover:border-indigo-500 hover:bg-indigo-100"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
        <svg className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      {fileName ? (
        <p className="text-sm font-medium text-indigo-700">
          ✓ {fileName}
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">
            Arraste o modelo <span className="font-semibold text-indigo-600">.docx</span> aqui
          </p>
          <p className="mt-1 text-xs text-gray-500">ou clique para selecionar</p>
        </>
      )}
    </div>
  );
}
