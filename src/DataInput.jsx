const SAMPLE = `116\tSanta Maria
117\tSão José
118\tNossa Senhora Aparecida
119\tSão Sebastião`;

export default function DataInput({ value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Dados das Paróquias
        <span className="ml-1 text-xs font-normal text-gray-400">(Número + TAB ou espaço + Nome)</span>
      </label>

      <textarea
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={SAMPLE}
        className="w-full rounded-xl border border-gray-300 bg-white p-4 font-mono text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
      />

      <p className="mt-2 text-xs text-gray-500">
        Cole os dados da planilha: cada linha com <strong>Número</strong> e <strong>Paróquia</strong> separados por TAB, traço ou espaço.
      </p>
    </div>
  );
}
