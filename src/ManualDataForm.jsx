import { useState } from 'react';

export default function ManualDataForm({ headers, onSubmit }) {
  const [row, setRow] = useState(() => Object.fromEntries(headers.map(h => [h, ''])));

  const handleChange = (header, value) => {
    setRow(prev => ({ ...prev, [header]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ headers, rows: [row] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3" style={{gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`}}>
        {headers.map(header => (
          <div key={header} className="flex flex-col">
            <label className="mb-1 text-xs text-slate-400">{header}</label>
            <input
              type="text"
              value={row[header] || ''}
              onChange={e => handleChange(header, e.target.value)}
              className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-white focus:border-fuchsia-400"
            />
          </div>
        ))}
      </div>
      <button type="submit" className="rounded bg-fuchsia-600 px-4 py-2 text-white font-semibold hover:bg-fuchsia-700">Salvar dados</button>
    </form>
  );
}
