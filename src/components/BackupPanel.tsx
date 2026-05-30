import { useRef, useState } from 'react';
import { Database, Download, Loader2, Upload, X } from 'lucide-react';
import { backupApi, type BackupData } from '../services/api';
import { useWriting } from '../stores/writing-store';

function backupFileName() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `fragment-writer-backup-${stamp}.json`;
}

function isBackupData(value: unknown): value is BackupData {
  const data = value as Partial<BackupData>;
  return (
    !!data &&
    data.version === 1 &&
    Array.isArray(data.projects) &&
    Array.isArray(data.fragments) &&
    Array.isArray(data.articles) &&
    Array.isArray(data.articleVersions)
  );
}

export default function BackupPanel() {
  const { ProjectActions } = useWriting();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setBusy('export');
    setError(null);
    setMessage(null);
    try {
      const data = await backupApi.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage(`已导出 ${data.projects.length} 个项目、${data.fragments.length} 条素材`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setBusy(null);
    }
  };

  const handleImportFile = async (file: File) => {
    setBusy('import');
    setError(null);
    setMessage(null);
    try {
      const parsed = JSON.parse(await file.text());
      if (!isBackupData(parsed)) {
        throw new Error('备份文件格式不正确');
      }

      const ok = window.confirm(
        `将用备份覆盖当前数据：${parsed.projects.length} 个项目、${parsed.fragments.length} 条素材。此操作会替换当前后端数据，确定继续吗？`
      );
      if (!ok) return;

      const result = await backupApi.restore(parsed, 'replace');
      await ProjectActions.reloadProjects();
      setMessage(`恢复完成：${result.projects} 个项目、${result.fragments} 条素材，正在刷新页面`);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-ink-200/70 dark:border-ink-800 p-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-ink-50/80 dark:bg-ink-800/50 text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Database size={15} className="text-amber-500" />
          数据备份
        </span>
        <span className="text-[10px] text-ink-400 dark:text-ink-500">{open ? '收起' : '导出/恢复'}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-ink-200/70 dark:border-ink-800 bg-white/70 dark:bg-ink-900/50 p-3 animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-xs leading-relaxed text-ink-500 dark:text-ink-400">
              导出全部项目、素材、文章与历史版本。恢复会覆盖当前后端数据，请先下载一份当前备份。
            </p>
            <button onClick={() => setOpen(false)} className="btn-icon !p-1 -mr-1 -mt-1">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={busy !== null}
              className="btn-primary px-3 py-2.5 text-xs"
            >
              {busy === 'export' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              导出 JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 dark:border-ink-700 px-3 py-2.5 text-xs font-bold text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              {busy === 'import' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              恢复
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
            }}
          />

          {message && <p className="mt-2 text-xs text-green-600 dark:text-green-400">{message}</p>}
          {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
