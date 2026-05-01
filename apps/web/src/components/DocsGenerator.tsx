import { useState } from 'react';
import { generateDocs } from '../lib/api';

interface DocsGeneratorProps {
  token: string;
}

export function DocsGenerator({ token }: DocsGeneratorProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [style, setStyle] = useState<'jsdoc' | 'docstring' | 'markdown'>('jsdoc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [docs, setDocs] = useState<string | undefined>();
  const [coverage, setCoverage] = useState<number | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setDocs(undefined);

    try {
      const result = await generateDocs(token, { code, language, style });
      setDocs(result.docs);
      setCoverage(result.coverage);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Auto Documentation</h2>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-slate-900 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Language</label>
            <input
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm"
              placeholder="typescript"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Style</label>
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value as typeof style)}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm"
            >
              <option value="jsdoc">JSDoc</option>
              <option value="docstring">Docstring</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Code</label>
          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            rows={8}
            className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm"
            placeholder="Paste your code here..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? 'Generating…' : 'Generate Docs'}
        </button>
      </form>

      {error && <p className="text-rose-400">{error}</p>}

      {docs && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generated Docs</h3>
            {coverage !== undefined && (
              <span className="text-sm text-slate-400">Coverage: {coverage}%</span>
            )}
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{docs}</pre>
        </div>
      )}
    </section>
  );
}
