import { useState, useCallback } from 'react';
import FileUpload from './FileUpload';
import DataInput from './DataInput';
import ProgressBar from './ProgressBar';
import { parseData, generateDocuments } from './documentGenerator';

export default function App() {
  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [rawData, setRawData] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!templateBuffer) {
      setMessage('Carregue o modelo .docx primeiro.');
      setStatus('error');
      return;
    }

    const entries = parseData(rawData);
    if (entries.length === 0) {
      setMessage('Nenhum dado válido encontrado. Verifique o formato.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setProgress(0);
    setMessage(`Gerando ${entries.length} ofício(s)...`);

    try {
      const total = await generateDocuments(templateBuffer, entries, setProgress);
      setStatus('done');
      setMessage(`✓ ${total} ofício(s) gerado(s) com sucesso! O download do ZIP iniciou automaticamente.`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(`Erro ao gerar documentos: ${err.message}`);
    }
  }, [templateBuffer, rawData]);

  const parsedCount = parseData(rawData).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="border-b border-indigo-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mala Direta</h1>
            <p className="text-xs text-gray-500">Geração automatizada de ofícios</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {/* Passo 1 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-1 text-sm font-semibold text-indigo-600">Passo 1</h2>
          <h3 className="mb-4 text-lg font-bold text-gray-800">Modelo do Ofício (.docx)</h3>
          <p className="mb-4 text-sm text-gray-500">
            O modelo deve conter as tags <code className="rounded bg-gray-100 px-1.5 py-0.5 text-indigo-600">{'{numero}'}</code> e <code className="rounded bg-gray-100 px-1.5 py-0.5 text-indigo-600">{'{paroquia}'}</code> nos locais onde os dados serão inseridos.
          </p>
          <FileUpload onFileLoaded={setTemplateBuffer} />
        </section>

        {/* Passo 2 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-1 text-sm font-semibold text-indigo-600">Passo 2</h2>
          <h3 className="mb-4 text-lg font-bold text-gray-800">Dados das Paróquias</h3>
          <DataInput value={rawData} onChange={setRawData} />
          {parsedCount > 0 && (
            <p className="mt-3 text-sm font-medium text-green-600">
              {parsedCount} registro(s) detectado(s)
            </p>
          )}
        </section>

        {/* Passo 3 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-1 text-sm font-semibold text-indigo-600">Passo 3</h2>
          <h3 className="mb-4 text-lg font-bold text-gray-800">Gerar Ofícios</h3>

          <button
            onClick={handleGenerate}
            disabled={status === 'processing'}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'processing' ? 'Gerando...' : 'Gerar Ofícios em Massa'}
          </button>

          {status === 'processing' && (
            <div className="mt-4">
              <ProgressBar progress={progress} label="Processando ofícios" />
            </div>
          )}

          {message && (
            <div
              className={`mt-4 rounded-lg p-3 text-sm ${
                status === 'done'
                  ? 'bg-green-50 text-green-700'
                  : status === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {message}
            </div>
          )}
        </section>

        {/* Info */}
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
          <h4 className="mb-2 text-sm font-semibold text-indigo-700">Como Funciona</h4>
          <ol className="list-inside list-decimal space-y-1 text-sm text-gray-600">
            <li>Crie um modelo <strong>.docx</strong> com as tags <code className="text-indigo-600">{'{numero}'}</code> e <code className="text-indigo-600">{'{paroquia}'}</code>.</li>
            <li>Cole a lista de dados (número e nome da paróquia) no campo de texto.</li>
            <li>Clique em <strong>"Gerar Ofícios em Massa"</strong> e baixe o arquivo ZIP.</li>
          </ol>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        Mala Direta — Processamento 100% no navegador, sem envio de dados para servidores.
      </footer>
    </div>
  );
}