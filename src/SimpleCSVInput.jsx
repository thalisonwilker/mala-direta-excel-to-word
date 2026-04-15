import { useState } from 'react';

export default function SimpleCSVInput({ onParsed }) {
  const [text, setText] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  const handleParse = () => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const dataRows = lines.map(line => line.split(';').map(f => f.trim()));
    // Gera headers genéricos: Campo1, Campo2, ...
    const maxLen = Math.max(...dataRows.map(r => r.length));
    const genHeaders = Array.from({length: maxLen}, (_, i) => `Campo${i+1}`);
    setHeaders(genHeaders);
    setRows(dataRows.map(arr => Object.fromEntries(genHeaders.map((h, i) => [h, arr[i] || '']))));
    onParsed({ headers: genHeaders, rows: dataRows.map(arr => Object.fromEntries(genHeaders.map((h, i) => [h, arr[i] || '']))) });
  };

  return (
    <div className="space-y-3">
        <p>
            Cole ou digite os dados aqui, separando os campos por ponto e vírgula (;) e cada registro em uma nova linha. Exemplo:
            <br />
            <code>
                João Silva;30;Engenheiro<br />
                Maria Souza;25;Designer
            </code>
        </p>
      <textarea
        className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white focus:border-fuchsia-400"
        rows={6}
        placeholder=""
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        type="button"
        className="rounded bg-fuchsia-600 px-4 py-2 text-white font-semibold hover:bg-fuchsia-700"
        onClick={handleParse}
        disabled={!text.trim()}
      >
        Usar dados informados
      </button>
      {headers.length > 0 && (
        <div className="mt-2 text-xs text-slate-300">
          <div>Detectado {rows.length} registro(s) e {headers.length} campo(s): {headers.join(', ')}</div>
        </div>
      )}
    </div>
  );
}
