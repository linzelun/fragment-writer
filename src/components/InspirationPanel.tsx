import { useState, useRef, useEffect } from 'react';
import { Lightbulb, FileText, Loader2, X, Copy, Check, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Fragment, InspirationResult, WritingProject } from '../types';
import { expandAngle, generateInspiration, generateScaffoldDraft } from '../services/ai-inspire';
import { recordAiUsage } from '../services/local-stats';
import { loadScaffoldDraft, saveScaffoldDraft } from '../utils/writing-helpers';
import { useToast } from '../contexts/ToastContext';

interface InspirationPanelProps {
  fragments: Fragment[];
  project: WritingProject;
  source: 'selected' | 'recent' | 'all';
  onAiUsed?: () => void;
  onSelectRecent?: () => void;
}

export default function InspirationPanel({
  fragments,
  project,
  source,
  onAiUsed,
  onSelectRecent,
}: InspirationPanelProps) {
  const toast = useToast();
  const [inspiration, setInspiration] = useState<InspirationResult | null>(null);
  const [expandedAngle, setExpandedAngle] = useState<string | null>(null);
  const [scaffoldDraft, setScaffoldDraft] = useState('');
  const [loadingInspire, setLoadingInspire] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingExpand, setLoadingExpand] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = loadScaffoldDraft(project.id);
    if (saved) setScaffoldDraft(saved);
    else setScaffoldDraft('');
    setInspiration(null);
    setExpandedAngle(null);
  }, [project.id, fragments.map((f) => f.id).join(',')]);

  useEffect(() => {
    saveScaffoldDraft(project.id, scaffoldDraft);
  }, [scaffoldDraft, project.id]);

  const cancel = () => {
    abortRef.current?.abort();
    setLoadingInspire(false);
    setLoadingDraft(false);
    setLoadingExpand(false);
  };

  const busy = loadingInspire || loadingDraft || loadingExpand;

  const sourceLabel =
    source === 'selected'
      ? `已选 ${fragments.length} 条`
      : source === 'recent'
        ? `自动用最近 ${fragments.length} 条`
        : `全部 ${fragments.length} 条`;

  const handleInspire = async () => {
    setError(null);
    setLoadingInspire(true);
    setInspiration(null);
    setExpandedAngle(null);
    abortRef.current = new AbortController();
    try {
      const result = await generateInspiration(fragments, project, { signal: abortRef.current.signal });
      setInspiration(result);
      recordAiUsage();
      onAiUsed?.();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setLoadingInspire(false);
    }
  };

  const handleExpand = async (angle: { title: string; description: string }) => {
    setLoadingExpand(true);
    setExpandedAngle(null);
    abortRef.current = new AbortController();
    try {
      const text = await expandAngle(angle, fragments, project, {
        signal: abortRef.current.signal,
        onContent: setExpandedAngle,
      });
      setExpandedAngle(text);
      recordAiUsage();
      onAiUsed?.();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setLoadingExpand(false);
    }
  };

  const handleScaffold = async (continueDraft = false) => {
    setError(null);
    setLoadingDraft(true);
    if (!continueDraft) setScaffoldDraft('');
    abortRef.current = new AbortController();
    try {
      await generateScaffoldDraft(fragments, project, {
        signal: abortRef.current.signal,
        baseDraft: continueDraft ? scaffoldDraft : undefined,
        onContent: setScaffoldDraft,
      });
      recordAiUsage();
      onAiUsed?.();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleCopy = async () => {
    if (!scaffoldDraft.trim()) return;
    await navigator.clipboard.writeText(scaffoldDraft);
    setCopied(true);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  if (fragments.length === 0) return null;

  return (
    <section className="section-card overflow-hidden border-violet-200/50 dark:border-violet-800/30">
      <div className="px-5 py-3.5 border-b border-ink-100/80 dark:border-ink-800/60 bg-violet-50/30 dark:bg-violet-950/20">
        <div className="flex flex-wrap items-center gap-2">
          <Lightbulb size={16} className="text-violet-600 dark:text-violet-400" />
          <h2 className="section-label">写作台</h2>
          <span className="text-xs text-ink-400">{sourceLabel}</span>
          {source !== 'selected' && onSelectRecent && (
            <button
              type="button"
              onClick={onSelectRecent}
              className="ml-auto text-xs text-violet-600 dark:text-violet-400 hover:underline"
            >
              手动勾选素材
            </button>
          )}
        </div>
        {source === 'recent' && (
          <p className="text-[11px] text-ink-400 mt-1">没选素材时，默认用最近的几条帮你找灵感</p>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleInspire()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loadingInspire ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
            给我灵感
          </button>
          <button
            type="button"
            onClick={() => void handleScaffold(false)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400 bg-white dark:bg-ink-900 px-4 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 disabled:opacity-50"
          >
            {loadingDraft && !scaffoldDraft ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            参考范文
          </button>
          {scaffoldDraft && !loadingDraft && (
            <button
              type="button"
              onClick={() => void handleScaffold(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-300 dark:border-ink-600 px-3 py-2.5 text-sm text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 disabled:opacity-50"
            >
              <RotateCcw size={14} /> 续写草稿
            </button>
          )}
          {busy && (
            <button type="button" onClick={cancel} className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-red-500">
              <X size={14} /> 取消
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {inspiration && (
          <div className="space-y-3 rounded-xl border border-violet-200/60 dark:border-violet-800/40 bg-white/80 dark:bg-ink-900/60 p-4 animate-fade-in">
            <div>
              <p className="text-xs text-ink-400 mb-0.5">可能的主题</p>
              <p className="font-semibold text-ink-800 dark:text-ink-100">{inspiration.theme}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400 mb-2">三个写作角度（点击展开）</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {inspiration.angles.map((angle) => (
                  <button
                    key={angle.title}
                    type="button"
                    onClick={() => void handleExpand(angle)}
                    disabled={loadingExpand}
                    className="rounded-xl border border-violet-200 dark:border-violet-800 p-3 text-left hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                  >
                    <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">{angle.title}</p>
                    <p className="mt-1 text-xs text-ink-500">{angle.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-ink-500"><span className="font-medium">关联：</span>{inspiration.connections}</p>
            <p className="text-xs text-ink-400"><span className="font-medium">还可以补充：</span>{inspiration.missing}</p>
          </div>
        )}

        {expandedAngle && (
          <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4 prose prose-sm prose-ink dark:prose-invert max-w-none">
            <ReactMarkdown>{expandedAngle}</ReactMarkdown>
          </div>
        )}

        {(scaffoldDraft || loadingDraft) && (
          <div className="rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-900/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                参考草稿 · 请按你的声音修改 · 已自动保存
              </p>
              {scaffoldDraft && (
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-700 dark:hover:text-ink-300"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制'}
                </button>
              )}
            </div>
            {loadingDraft && !scaffoldDraft ? (
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <Loader2 size={16} className="animate-spin" /> AI 正在写草稿…
              </div>
            ) : (
              <textarea
                value={scaffoldDraft}
                onChange={(e) => setScaffoldDraft(e.target.value)}
                rows={10}
                className="w-full resize-y rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-3 text-sm font-serif leading-relaxed"
              />
            )}
          </div>
        )}

        <p className="text-[11px] text-ink-400 text-center">
          想要完整成文？用底部「AI 生成」整合全部素材
        </p>
      </div>
    </section>
  );
}
