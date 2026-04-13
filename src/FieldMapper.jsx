import { useEffect, useLayoutEffect, useRef, useState } from 'react';

function buildCurve(start, end) {
  const controlOffset = Math.max(60, (end.x - start.x) * 0.35);
  return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
}

export default function FieldMapper({
  templateTags,
  excelHeaders,
  fieldMap,
  onChange,
  filenamePattern,
  onFilenamePatternChange,
}) {
  const containerRef = useRef(null);
  const tagRefs = useRef({});
  const headerRefs = useRef({});
  const [selectedTag, setSelectedTag] = useState('');
  const [layout, setLayout] = useState({ lines: [], height: 320 });

  useEffect(() => {
    if (selectedTag && !templateTags.includes(selectedTag)) {
      setSelectedTag('');
    }
  }, [selectedTag, templateTags]);

  useLayoutEffect(() => {
    const updateLayout = () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const nextLines = Object.entries(fieldMap)
        .filter(([, header]) => Boolean(header))
        .map(([tag, header]) => {
          const tagNode = tagRefs.current[tag];
          const headerNode = headerRefs.current[header];
          if (!tagNode || !headerNode) {
            return null;
          }

          const tagRect = tagNode.getBoundingClientRect();
          const headerRect = headerNode.getBoundingClientRect();
          return {
            tag,
            header,
            start: {
              x: tagRect.right - containerRect.left,
              y: tagRect.top - containerRect.top + tagRect.height / 2,
            },
            end: {
              x: headerRect.left - containerRect.left,
              y: headerRect.top - containerRect.top + headerRect.height / 2,
            },
          };
        })
        .filter(Boolean);

      setLayout({
        lines: nextLines,
        height: container.scrollHeight,
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [fieldMap, templateTags, excelHeaders]);

  const connectTagToHeader = (tag, header) => {
    onChange({
      ...fieldMap,
      [tag]: header,
    });
    setSelectedTag('');
  };

  const clearConnection = (tag) => {
    onChange({
      ...fieldMap,
      [tag]: '',
    });
  };

  const appendTagToPattern = (tag) => {
    const token = `{${tag}}`;
    const nextPattern = filenamePattern
      ? `${filenamePattern} ${token}`
      : token;
    onFilenamePatternChange(nextPattern);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
        <span>Selecione uma tag do modelo e depois uma coluna da planilha para criar a ligação.</span>
        {selectedTag && (
          <span className="rounded-full bg-fuchsia-400/15 px-2.5 py-1 text-xs font-medium text-fuchsia-200">
            Ligando {`{${selectedTag}}`}
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(135deg,_#0f172a,_#1e1b4b_52%,_#111827)] p-4 text-white shadow-lg"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 1000 ${Math.max(layout.height, 320)}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {layout.lines.map((line) => {
            const start = {
              x: (line.start.x / containerRef.current.getBoundingClientRect().width) * 1000,
              y: line.start.y,
            };
            const end = {
              x: (line.end.x / containerRef.current.getBoundingClientRect().width) * 1000,
              y: line.end.y,
            };
            return (
              <g key={`${line.tag}-${line.header}`}>
                <path
                  d={buildCurve(start, end)}
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d={buildCurve(start, end)}
                  fill="none"
                  stroke="url(#connectionGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
              </g>
            );
          })}
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)]">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">Tags do modelo</p>
              <p className="mt-1 text-xs text-slate-300">Marcadores detectados automaticamente no .docx</p>
            </div>
            {templateTags.map((tag) => {
              const mappedHeader = fieldMap[tag];
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  ref={(node) => {
                    tagRefs.current[tag] = node;
                  }}
                  onClick={() => setSelectedTag(tag)}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? 'border-fuchsia-300 bg-fuchsia-500/20 shadow-[0_0_0_1px_rgba(232,121,249,0.45)]'
                      : mappedHeader
                        ? 'border-indigo-300/30 bg-white/8 hover:bg-white/12'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-white">{`{${tag}}`}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {mappedHeader ? `Ligado a ${mappedHeader}` : 'Sem ligação'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${mappedHeader ? 'bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.9)]' : 'bg-slate-500'}`} />
                    {mappedHeader && (
                      <span
                        onClick={(event) => {
                          event.stopPropagation();
                          clearConnection(tag);
                        }}
                        className="rounded-full border border-white/15 px-2 py-1 text-[10px] font-medium text-slate-200 opacity-0 transition group-hover:opacity-100"
                      >
                        limpar
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">Fluxo</p>
              <p className="mt-1 text-sm font-medium text-white">Word → Excel</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Campos da planilha</p>
              <p className="mt-1 text-xs text-slate-300">Colunas disponíveis no arquivo Excel</p>
            </div>
            {excelHeaders.map((header) => {
              const linkedTags = templateTags.filter((tag) => fieldMap[tag] === header);
              const canConnect = Boolean(selectedTag);
              return (
                <button
                  key={header}
                  type="button"
                  ref={(node) => {
                    headerRefs.current[header] = node;
                  }}
                  onClick={() => canConnect && connectTagToHeader(selectedTag, header)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    canConnect
                      ? 'border-emerald-300/40 bg-emerald-400/10 hover:bg-emerald-400/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{header}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        {linkedTags.length > 0 ? `${linkedTags.length} ligação(ões)` : 'Pronto para conectar'}
                      </p>
                    </div>
                    <span className={`h-3 w-3 rounded-full ${linkedTags.length > 0 ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600">Ligações criadas</p>
          <p className="mt-1 text-xs text-slate-500">
            Revise aqui o que já foi conectado antes de seguir para a geração. Se algo estiver faltando, volte ao mapa e complete a ligação.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {templateTags.filter((tag) => fieldMap[tag]).length > 0 ? (
              templateTags.filter((tag) => fieldMap[tag]).map((tag) => (
                <span key={tag} className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs text-slate-700">
                  {`{${tag}} → ${fieldMap[tag]}`}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">Nenhuma ligação criada ainda.</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="mb-2 block text-xs font-medium text-slate-600">
            Padrão do nome do arquivo
          </label>
          <p className="mb-3 text-xs text-slate-500">
            Monte o nome exatamente no formato que você precisa. Você pode combinar texto fixo com qualquer tag detectada no Word.
          </p>
          <input
            type="text"
            value={filenamePattern}
            onChange={(e) => onFilenamePatternChange(e.target.value)}
            placeholder="OFICIO {numero}.2026.FEST - {paroquia}"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Exemplo prático: OFICIO {`{numero}`}.2026.FEST - {`{paroquia}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {templateTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => appendTagToPattern(tag)}
                className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50"
              >
                {`{${tag}}`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {Object.values(fieldMap).filter(Boolean).length} de {templateTags.length} tag(s) conectada(s)
          </p>
        </div>
      </div>
    </div>
  );
}
