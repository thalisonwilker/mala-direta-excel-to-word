import { useState, useCallback, useEffect } from 'react';
import FileUpload from './FileUpload';
import ExcelUpload from './ExcelUpload';
import FieldMapper from './FieldMapper';
import ProgressBar from './ProgressBar';
import { extractTemplateTags, generateDocuments } from './documentGenerator';

function buildDefaultFilenamePattern(tags) {
  const numberTag = tags.find((tag) => ['numero', 'number', 'codigo', 'id'].includes(tag.toLowerCase()));
  const labelTag = tags.find((tag) => ['nome', 'name', 'titulo', 'title', 'descricao', 'description'].includes(tag.toLowerCase()))
    || tags.find((tag) => tag !== numberTag);

  if (numberTag && labelTag) {
    return `DOCUMENTO {${numberTag}} - {${labelTag}}`;
  }
  if (numberTag) {
    return `DOCUMENTO {${numberTag}}`;
  }
  if (labelTag) {
    return `DOCUMENTO - {${labelTag}}`;
  }
  if (tags[0]) {
    return `DOCUMENTO - {${tags[0]}}`;
  }
  return 'DOCUMENTO';
}

export default function App() {
  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [templateTags, setTemplateTags] = useState([]);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelRows, setExcelRows] = useState([]);
  const [fieldMap, setFieldMap] = useState({});
  const [filenamePattern, setFilenamePattern] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleTemplateLoaded = useCallback((buffer) => {
    setTemplateBuffer(buffer);
    try {
      const tags = extractTemplateTags(buffer);
      setTemplateTags(tags);
      setFilenamePattern((prev) => prev || buildDefaultFilenamePattern(tags));
      // Auto-map: try to match tag names with excel headers (case-insensitive)
      setFieldMap((prev) => {
        const next = {};
        for (const tag of tags) {
          const match = excelHeaders.find(
            (h) => h.toLowerCase() === tag.toLowerCase()
          );
          next[tag] = prev[tag] || match || '';
        }
        return next;
      });
    } catch (err) {
      console.error('Erro ao extrair tags:', err);
      setTemplateTags([]);
    }
  }, [excelHeaders]);

  const handleExcelParsed = useCallback(({ headers, rows }) => {
    setExcelHeaders(headers);
    setExcelRows(rows);
    // Auto-map existing tags to matching headers
    setFieldMap((prev) => {
      const next = { ...prev };
      for (const tag of templateTags) {
        if (!next[tag]) {
          const match = headers.find(
            (h) => h.toLowerCase() === tag.toLowerCase()
          );
          if (match) next[tag] = match;
        }
      }
      return next;
    });
  }, [templateTags]);

  useEffect(() => {
    if (excelRows.length > 0) {
      const element = document.getElementById('step-3-mapper');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [excelRows]);

  const mappedCount = Object.values(fieldMap).filter(Boolean).length;

  const handleGenerate = useCallback(async () => {
    if (!templateBuffer) {
      setMessage('Carregue o arquivo de modelo .docx antes de gerar o lote.');
      setStatus('error');
      return;
    }
    if (excelRows.length === 0) {
      setMessage('Carregue a planilha Excel com os dados antes de continuar.');
      setStatus('error');
      return;
    }
    if (mappedCount === 0) {
      setMessage('Crie pelo menos uma ligação no mapa visual antes de gerar.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setProgress(0);
    setMessage(`Gerando ${excelRows.length} documento(s) do lote...`);

    try {
      const total = await generateDocuments(
        templateBuffer,
        excelRows,
        fieldMap,
        filenamePattern,
        setProgress
      );
      setStatus('done');
      setMessage(`✓ ${total} documento(s) gerado(s) com sucesso. O download do ZIP começou automaticamente.`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(`Erro ao gerar documentos: ${err.message}`);
    }
  }, [templateBuffer, excelRows, fieldMap, filenamePattern, mappedCount]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070311] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.28),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.20),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_18%)]" />

        <header className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-white">Mapeador de Documentos</h1>
                <p className="text-xs text-slate-300">Modelo Word, planilha Excel e geração em lote no navegador</p>
              </div>
            </div>
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 md:block">
              Word → Excel → Mapa Visual → Lote
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl px-6 pb-16 pt-10">
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-200">
                Automação documental sem backend
              </div>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Transforme um modelo base em um lote completo de documentos com mapeamento visual.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Envie um arquivo de modelo em Word, detecte automaticamente as tags, conecte cada uma às colunas da planilha e gere todos os arquivos finais com um padrão de nome controlado por você.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Tags detectadas automaticamente</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Planilha Excel como fonte de dados</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Conexões em mapa visual</span>
              </div>
            </div>

            <div className="relative rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="absolute left-8 top-8 h-3 w-3 rounded-full bg-fuchsia-400 shadow-[0_0_25px_rgba(232,121,249,0.9)]" />
              <div className="absolute bottom-8 right-10 h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_25px_rgba(167,139,250,0.9)]" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 260" fill="none" aria-hidden="true">
                <path d="M60 150C100 150 140 100 195 100C250 100 290 150 340 150" stroke="rgba(255,255,255,0.1)" strokeWidth="20" />
                <path d="M60 150C100 150 140 100 195 100C250 100 290 150 340 150" stroke="url(#pulse-1)" strokeWidth="3" strokeLinecap="round" />
                <defs>
                  <linearGradient id="pulse-1" x1="60" x2="340" y1="150" y2="150" gradientUnits="userSpaceOnUse">
                    <stop stopColor="rgba(168, 85, 247, 0.8)" />
                    <stop offset="0.5" stopColor="rgba(167, 139, 250, 0.9)" />
                    <stop offset="1" stopColor="rgba(99, 102, 241, 0.8)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="relative space-y-6">
                <div className="rounded-3xl border border-white/10 bg-[#11081f] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Conceito</p>
                  <p className="mt-2 text-lg font-semibold text-white">Word detecta tags, Excel fornece dados, o mapa define a lógica.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-2xl font-semibold text-fuchsia-300">Word</p>
                    <p className="mt-2 text-sm text-slate-300">Modelo com marcadores entre chaves</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-2xl font-semibold text-violet-300">Excel</p>
                    <p className="mt-2 text-sm text-slate-300">Planilha com colunas e linhas</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-2xl font-semibold text-indigo-300">Mapa</p>
                    <p className="mt-2 text-sm text-slate-300">Conexão visual entre os campos</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-fuchsia-200">Passo 1</h3>
                <h4 className="mt-2 text-2xl font-semibold text-white">Modelo base em Word</h4>
                <div className="mt-5">
                  <FileUpload onFileLoaded={handleTemplateLoaded} />
                </div>
                {templateTags.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-slate-300">Tags detectadas no documento:</p>
                    <div className="flex flex-wrap gap-2">
                      {templateTags.map((tag) => (
                        <span key={tag} className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-100">
                          {`{${tag}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
              <div className="rounded-2xl border border-fuchsia-400/15 bg-[#140a26] p-4 text-sm text-slate-200">
                <p className="font-semibold text-fuchsia-200">Dica do passo 1</p>
                <p className="mt-2 leading-6 text-slate-300">
                  Uma tag é um marcador entre chaves dentro do arquivo de modelo, como {'{nome_cliente}'} ou {'{numero_documento}'}. Quando você envia o .docx, o sistema lê o texto do documento e detecta automaticamente todos os marcadores nesse formato.
                </p>
                <p className="mt-2 leading-6 text-slate-300">
                  Para adicionar novas tags, basta abrir seu arquivo base no Word e escrever o marcador exatamente onde o valor final deve aparecer. Use nomes claros, sem ambiguidade, porque serão esses nomes que você verá no mapa visual.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-200">Passo 2</h3>
                <h4 className="mt-2 text-2xl font-semibold text-white">Planilha de dados</h4>
                <div className="mt-5">
                  <ExcelUpload onParsed={handleExcelParsed} />
                </div>
                {excelHeaders.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-slate-300">Colunas de dados detectadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {excelHeaders.map((header) => (
                        <span key={header} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
              <div className="rounded-2xl border border-violet-400/15 bg-[#100b24] p-4 text-sm text-slate-200">
                <p className="font-semibold text-violet-200">Dica do passo 2</p>
                <p className="mt-2 leading-6 text-slate-300">
                  A planilha funciona como a fonte de dados do lote. Cada coluna representa um campo possível e cada linha representa um documento que será gerado.
                </p>
                <p className="mt-2 leading-6 text-slate-300">
                  A primeira linha precisa conter os cabeçalhos, porque são eles que o sistema usa para montar as conexões. Se o cabeçalho for Numero, Nome ou Setor, por exemplo, esses nomes aparecerão como opções no mapa visual.
                </p>
              </div>
            </div>
          </div>

          {templateTags.length > 0 && excelHeaders.length > 0 && (
            <div id="step-3-mapper" className="mt-6 space-y-3">
              <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Passo 3</h3>
                <h4 className="mt-2 text-2xl font-semibold text-white">Mapa visual de campos</h4>
                <div className="mt-5">
                  <FieldMapper
                    templateTags={templateTags}
                    excelHeaders={excelHeaders}
                    fieldMap={fieldMap}
                    onChange={setFieldMap}
                    filenamePattern={filenamePattern}
                    onFilenamePatternChange={setFilenamePattern}
                  />
                </div>
              </section>
              <div className="rounded-2xl border border-amber-400/15 bg-[#17101f] p-4 text-sm text-slate-200">
                <p className="font-semibold text-amber-200">Dica do passo 3</p>
                <p className="mt-2 leading-6 text-slate-300">
                  O mapa visual é a camada lógica do processo. À esquerda ficam as tags detectadas no modelo e, à direita, as colunas encontradas na planilha. Cada conexão informa qual coluna deve preencher qual marcador no documento final.
                </p>
                <p className="mt-2 leading-6 text-slate-300">
                  Pense assim: a tag define o lugar onde o valor entra no Word; a coluna define de onde esse valor vem no Excel. Quando os dois estão ligados, o sistema sabe exatamente como montar cada arquivo do lote.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">
                {templateTags.length > 0 && excelHeaders.length > 0 ? 'Passo 4' : 'Passo 3'}
              </h3>
              <h4 className="mt-2 text-2xl font-semibold text-white">Gerar lote</h4>

              <div className="mt-5">
                <button
                  onClick={handleGenerate}
                  disabled={status === 'processing'}
                  className="w-full cursor-pointer rounded-2xl bg-[linear-gradient(90deg,#7c3aed,#a855f7)] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(168,85,247,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'processing' ? 'Gerando lote...' : `Gerar ${excelRows.length || ''} documento(s)`}
                </button>
              </div>

              {status === 'processing' && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <ProgressBar progress={progress} label="Processando lote" />
                </div>
              )}

              {message && (
                <div
                  className={`mt-4 rounded-2xl border p-4 text-sm ${
                    status === 'done'
                      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                      : status === 'error'
                        ? 'border-rose-400/20 bg-rose-500/10 text-rose-100'
                        : 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100'
                  }`}
                >
                  {message}
                </div>
              )}
            </section>
            <div className="rounded-2xl border border-cyan-400/15 bg-[#0f1324] p-4 text-sm text-slate-200">
              <p className="font-semibold text-cyan-200">Dica do passo final</p>
              <p className="mt-2 leading-6 text-slate-300">
                Antes de gerar, confira se as ligações essenciais estão criadas e se o padrão de nome do arquivo está no formato que o seu processo exige. O sistema vai repetir essa lógica para cada linha da planilha.
              </p>
              <p className="mt-2 leading-6 text-slate-300">
                O resultado sai em um único ZIP, pronto para revisão, distribuição ou impressão. Todo o processamento acontece no navegador, sem envio de dados para servidor.
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold text-fuchsia-200">1. O que é uma tag</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  É um identificador entre chaves colocado dentro do modelo Word. Exemplo: {'{nome}'}, {'{numero}'}, {'{departamento}'}. O sistema detecta essas marcações quando o arquivo é enviado.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold text-violet-200">2. Como a planilha entra</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Cada coluna da planilha vira uma origem de dados. Cada linha vira um documento potencial. O mapeamento decide qual coluna preenche cada tag.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold text-cyan-200">3. Como o lote é montado</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  O sistema percorre as linhas da planilha, aplica as conexões definidas no mapa visual e gera um arquivo individual para cada registro com o padrão de nome configurado.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="relative border-t border-white/10 py-5 text-center text-xs text-slate-400">
          Mapeador de Documentos — automação documental genérica com Word, Excel e geração de lote no navegador.
        </footer>
    </div>
  );
}