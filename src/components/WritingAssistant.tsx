import { useState, useRef, useEffect, useCallback } from 'react';
import { useWriting } from '../stores/writing-store';
import {
  generateOutline, generateSections,
  polishText, grammarCheck,
  getWritingSuggestions,
  analyzeFragments,
  STYLE_PRESETS, LITERARY_SUB_STYLES,
  type OutlineResult,
  type WritingSuggestions,
  type FragmentAnalysis,
} from '../services/ai-enhanced';
import {
  Sparkles, Wand2, Lightbulb, ListChecks,
  RefreshCw, Loader2,
  Check, AlertCircle, Copy, Play, ArrowRight,
  BookOpen, PenTool, Zap, CornerDownRight, X,
  PieChart, GitBranch, Target, ChevronDown,
} from 'lucide-react';

type TabKey = 'generate' | 'polish' | 'guide' | 'analyze';

interface WritingAssistantProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export default function WritingAssistant({ isOpen, onToggle }: WritingAssistantProps) {
  const { activeProject, sortedFragments, state, dispatch, ArticleActions } = useWriting();

  const [activeTab, setActiveTab] = useState<TabKey>('generate');

  // ---- 一键生成 ----
  const [outline, setOutline] = useState<OutlineResult | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineError, setOutlineError] = useState<string | null>(null);
  const [confirmedSections, setConfirmedSections] = useState<Set<string>>(new Set());
  const [generatingSections, setGeneratingSections] = useState(false);
  const [sectionStreams, setSectionStreams] = useState<Record<string, string>>({});
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string>('');

  // ---- 智能优化 ----
  const [polishStyle, setPolishStyle] = useState('casual');
  const [polishInput, setPolishInput] = useState('');
  const [polishResult, setPolishResult] = useState('');
  const [polishLoading, setPolishLoading] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [grammarResult, setGrammarResult] = useState<{
    corrected: string;
    changes: { original: string; fixed: string; reason: string }[];
  } | null>(null);

  // ---- 引导式写作 ----
  const [guideInput, setGuideInput] = useState('');
  const [suggestions, setSuggestions] = useState<WritingSuggestions | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const guideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- 素材分析 ----
  const [fragmentAnalysis, setFragmentAnalysis] = useState<FragmentAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ---- 文学子风格 ----
  const [literarySubStyle, setLiterarySubStyle] = useState<string | null>(null);
  const [showStyleSelect, setShowStyleSelect] = useState(false);

  useEffect(() => {
    return () => {
      if (guideTimer.current) clearTimeout(guideTimer.current);
    };
  }, []);

  if (!activeProject) return null;

  /* ================================================================
     一键生成：大纲 → 段落生成
     ================================================================ */

  const handleGenerateOutline = async () => {
    setOutlineLoading(true);
    setOutlineError(null);
    setOutline(null);
    setConfirmedSections(new Set());
    setGeneratedArticle('');
    setSectionStreams({});

    const result = await generateOutline(
      activeProject.topic,
      sortedFragments,
      { onError: (msg) => setOutlineError(msg) }
    );

    if (result) {
      setOutline(result);
      setConfirmedSections(new Set(result.sections.map(s => s.id)));
    }
    setOutlineLoading(false);
  };

  const toggleSection = (id: string) => {
    setConfirmedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateArticle = async () => {
    if (!outline || confirmedSections.size === 0) return;

    const sectionsToGenerate = outline.sections.filter(s => confirmedSections.has(s.id));
    const filteredOutline: OutlineResult = {
      ...outline,
      sections: sectionsToGenerate,
    };

    setGeneratingSections(true);
    setGeneratedArticle('');
    setSectionStreams({});
    setOutlineError(null);

    await generateSections(
      activeProject.topic,
      filteredOutline,
      sortedFragments,
      activeProject.tone,
      activeProject.tone === 'storytelling' ? literarySubStyle : null,
      {
        onSectionStart: (sectionId) => {
          setCurrentSectionId(sectionId);
        },
        onSectionChunk: (sectionId, text) => {
          setSectionStreams(prev => ({ ...prev, [sectionId]: text }));
        },
        onSectionDone: (_sectionId, content) => {
          setGeneratedArticle(prev => prev + content + '\n\n');
        },
        onAllDone: (fullContent) => {
          setGeneratedArticle(fullContent);
          setCurrentSectionId(null);
        },
        onError: (msg) => setOutlineError(msg),
      }
    );

    setGeneratingSections(false);
  };

  const handleSaveGeneratedArticle = async () => {
    if (!generatedArticle || !activeProject) return;

    const title = outline?.title || activeProject.topic;
    const article = {
      title,
      content: generatedArticle,
      summary: `基于 ${confirmedSections.size} 个大纲章节生成`,
      generatedAt: new Date().toISOString(),
      fragmentCount: sortedFragments.length,
    };

    ArticleActions.saveArticle(activeProject.id, article).catch(() => {});
    dispatch({ type: 'SAVE_ARTICLE', projectId: activeProject.id, article });
  };

  /* ================================================================
     智能优化
     ================================================================ */

  const handlePolish = async () => {
    if (!polishInput.trim()) return;
    setPolishLoading(true);
    setPolishError(null);
    setPolishResult('');

    const result = await polishText(polishInput, polishStyle, {
      onChunk: (text) => setPolishResult(text),
      onError: (msg) => setPolishError(msg),
    });

    if (result) setPolishResult(result);
    setPolishLoading(false);
  };

  const handleGrammarCheck = async () => {
    if (!polishInput.trim()) return;
    setPolishLoading(true);
    setPolishError(null);
    setGrammarResult(null);

    const result = await grammarCheck(polishInput, {
      onError: (msg) => setPolishError(msg),
    });

    if (result) setGrammarResult(result);
    setPolishLoading(false);
  };

  const handleCopyPolish = () => {
    navigator.clipboard.writeText(polishResult).catch(() => {});
  };

  /* ================================================================
     引导式写作
     ================================================================ */

  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text.trim() || guideLoading) return;
    setGuideLoading(true);
    setGuideError(null);

    // 构建文章结构摘要（如有大纲）
    const structureSummary = outline
      ? outline.sections.map(s => `- ${s.title}`).join('\n')
      : undefined;

    const result = await getWritingSuggestions(
      activeProject.topic,
      text,
      structureSummary,
      { onError: (msg) => setGuideError(msg) }
    );

    if (result) setSuggestions(result);
    setGuideLoading(false);
  }, [activeProject.topic, guideLoading]);

  const handleGuideInputChange = (value: string) => {
    setGuideInput(value);
    if (guideTimer.current) clearTimeout(guideTimer.current);

    guideTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 1500);
  };

  const handleInsertKeyword = (keyword: string) => {
    setGuideInput(prev => prev + (prev && !prev.endsWith('，') ? '，' : '') + keyword);
  };

  /* ================================================================
     素材分析
     ================================================================ */

  const handleAnalyzeFragments = async () => {
    if (sortedFragments.length === 0) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setFragmentAnalysis(null);

    const result = await analyzeFragments(
      activeProject.topic,
      sortedFragments,
      { onError: (msg) => setAnalysisError(msg) }
    );

    if (result) setFragmentAnalysis(result);
    setAnalysisLoading(false);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'generate', label: '一键生成', icon: <Wand2 size={14} /> },
    { key: 'polish', label: '智能优化', icon: <PenTool size={14} /> },
    { key: 'guide', label: '写作引导', icon: <Lightbulb size={14} /> },
    { key: 'analyze', label: '素材分析', icon: <PieChart size={14} /> },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => onToggle(false)} />
      <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-ink-900 shadow-2xl animate-slide-in-left overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200 dark:border-ink-800 shrink-0">
          <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100">AI 写作助手</h2>
          <button
            onClick={() => onToggle(false)}
            className="p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <X size={16} className="text-ink-400 dark:text-ink-300" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ink-100 dark:border-ink-800 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500'
                  : 'text-ink-400 dark:text-ink-300 hover:text-ink-600 dark:hover:text-ink-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* ======== Tab 1: 一键生成 ======== */}
          {activeTab === 'generate' && (
            <div className="space-y-3">
              {!outline && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ListChecks size={14} className="text-violet-500" />
                    <span className="text-xs font-bold text-ink-700 dark:text-ink-200">
                      第一步：生成文章大纲
                    </span>
                  </div>
                  <p className="text-xs text-ink-400 dark:text-ink-300">
                    基于主题「{activeProject.topic}」{sortedFragments.length > 0 ? `和 ${sortedFragments.length} 条素材` : ''}生成结构化大纲。当前风格：{STYLE_PRESETS[activeProject.tone]?.name || '口语随笔'}
                  </p>
                  {activeProject.tone === 'storytelling' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowStyleSelect(!showStyleSelect)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 text-xs text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                      >
                        <span>{literarySubStyle ? LITERARY_SUB_STYLES.find(s => s.key === literarySubStyle)?.name : '选择文学子风格（可选）'}</span>
                        <ChevronDown size={12} />
                      </button>
                      {showStyleSelect && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowStyleSelect(false)} />
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-lg py-1 z-20">
                            {LITERARY_SUB_STYLES.map(s => (
                              <button
                                key={s.key}
                                onClick={() => { setLiterarySubStyle(s.key); setShowStyleSelect(false); }}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                  literarySubStyle === s.key
                                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-medium'
                                    : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                                }`}
                              >
                                <div>{s.name}</div>
                                <div className="text-[10px] text-ink-400 dark:text-ink-300 mt-0.5">{s.description}</div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleGenerateOutline}
                    disabled={outlineLoading}
                    className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-ink-200 dark:disabled:bg-ink-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {outlineLoading ? (
                      <><Loader2 size={14} className="animate-spin" /> 生成中...</>
                    ) : (
                      <><Sparkles size={14} /> 生成大纲</>
                    )}
                  </button>
                  {outlineError && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-xs text-red-600">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      {outlineError}
                    </div>
                  )}
                </div>
              )}

              {outline && !generatingSections && !generatedArticle && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks size={14} className="text-violet-500" />
                      <span className="text-xs font-bold text-ink-700 dark:text-ink-200">
                        第二步：确认大纲
                      </span>
                    </div>
                    <button
                      onClick={() => { handleGenerateOutline(); }}
                      className="p-1 rounded hover:bg-ink-100 dark:hover:bg-ink-800"
                      title="重新生成"
                    >
                      <RefreshCw size={12} className="text-ink-400" />
                    </button>
                  </div>

                  <div className="p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <h4 className="text-sm font-bold text-ink-800 dark:text-ink-200">
                      {outline.title}
                    </h4>
                    <p className="text-xs text-ink-400 dark:text-ink-300 mt-0.5">
                      预计 {outline.estimatedWords} 字 · {outline.sections.length} 个章节
                    </p>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {outline.sections.map((section) => (
                      <label
                        key={section.id}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          confirmedSections.has(section.id)
                            ? 'border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10'
                            : 'border-ink-200 dark:border-ink-700 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={confirmedSections.has(section.id)}
                          onChange={() => toggleSection(section.id)}
                          className="mt-0.5 shrink-0 accent-violet-500"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-1 rounded ${
                              section.type === 'h2'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {section.type.toUpperCase()}
                            </span>
                            <span className="text-xs font-medium text-ink-700 dark:text-ink-200 truncate">
                              {section.title}
                            </span>
                          </div>
                          {section.keyPoints.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {section.keyPoints.map((kp, i) => (
                                <span key={i} className="text-[10px] text-ink-400 dark:text-ink-300 bg-ink-100 dark:bg-ink-800 px-1.5 py-0.5 rounded">
                                  {kp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleGenerateArticle}
                    disabled={confirmedSections.size === 0}
                    className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-ink-200 dark:disabled:bg-ink-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={14} />
                    确认并生成（{confirmedSections.size} 个章节）
                  </button>
                </div>
              )}

              {generatingSections && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="text-violet-500 animate-spin" />
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-400">
                      正在生成段落...
                    </span>
                  </div>

                  {outline!.sections.filter(s => confirmedSections.has(s.id)).map(section => (
                    <div key={section.id} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {currentSectionId === section.id ? (
                          <Loader2 size={10} className="text-violet-500 animate-spin" />
                        ) : sectionStreams[section.id] ? (
                          <Check size={10} className="text-green-500" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full border border-ink-300 dark:border-ink-600" />
                        )}
                        <span className="text-xs font-medium text-ink-600 dark:text-ink-300">
                          {section.title}
                        </span>
                      </div>
                      {sectionStreams[section.id] && (
                        <div className="text-[10px] text-ink-400 dark:text-ink-300 pl-4 leading-relaxed max-h-16 overflow-hidden">
                          {sectionStreams[section.id].slice(0, 120)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {generatedArticle && !generatingSections && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-400">
                      生成完成！
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 max-h-48 overflow-y-auto">
                    <div className="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap">
                      {generatedArticle.slice(0, 500)}
                      {generatedArticle.length > 500 && (
                        <p className="text-ink-400 dark:text-ink-300 mt-1">...（共 {generatedArticle.length} 字）</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveGeneratedArticle}
                      className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <BookOpen size={13} />
                      保存到文章
                    </button>
                    <button
                      onClick={() => {
                        setOutline(null);
                        setGeneratedArticle('');
                        setConfirmedSections(new Set());
                        setSectionStreams({});
                      }}
                      className="py-2.5 px-3 rounded-xl border border-ink-200 dark:border-ink-700 text-xs font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                    >
                      重新开始
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======== Tab 2: 智能优化 ======== */}
          {activeTab === 'polish' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PenTool size={14} className="text-purple-500" />
                <span className="text-xs font-bold text-ink-700 dark:text-ink-200">
                  文本润色与纠错
                </span>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-ink-400 dark:text-ink-300 uppercase tracking-wide mb-1.5 block">
                  目标风格
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => setPolishStyle(key)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                        polishStyle === key
                          ? 'bg-purple-500 text-white'
                          : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
                      }`}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-ink-400 dark:text-ink-300 uppercase tracking-wide mb-1.5 block">
                  待优化文本
                </label>
                <textarea
                  value={polishInput}
                  onChange={(e) => setPolishInput(e.target.value)}
                  placeholder="粘贴或输入需要润色的文本..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 px-3 py-2 text-xs text-ink-800 dark:text-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePolish}
                  disabled={!polishInput.trim() || polishLoading}
                  className="flex-1 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-ink-200 dark:disabled:bg-ink-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {polishLoading ? (
                    <><Loader2 size={12} className="animate-spin" /> 处理中...</>
                  ) : (
                    <><Sparkles size={12} /> 风格润色</>
                  )}
                </button>
                <button
                  onClick={handleGrammarCheck}
                  disabled={!polishInput.trim() || polishLoading}
                  className="py-2 px-3 rounded-xl border border-ink-200 dark:border-ink-700 text-xs font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                  title="仅检查语法"
                >
                  纠错
                </button>
              </div>

              {polishError && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-xs text-red-600">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  {polishError}
                </div>
              )}

              {grammarResult && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-2">
                    {grammarResult.changes.length > 0 ? `发现 ${grammarResult.changes.length} 处可修正` : '未发现语法错误'}
                  </h4>
                  {grammarResult.changes.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] mb-1.5">
                      <span className="text-red-500 line-through shrink-0">{c.original}</span>
                      <ArrowRight size={10} className="shrink-0 mt-0.5 text-ink-400" />
                      <span className="text-green-600 shrink-0">{c.fixed}</span>
                      <span className="text-ink-400 dark:text-ink-300">{c.reason}</span>
                    </div>
                  ))}
                  {grammarResult.changes.length > 0 && (
                    <button
                      onClick={() => setPolishInput(grammarResult.corrected)}
                      className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium hover:underline"
                    >
                      应用所有修正
                    </button>
                  )}
                </div>
              )}

              {polishResult && (
                <div className="p-3 rounded-xl bg-white dark:bg-ink-800 border border-purple-200 dark:border-purple-900/30 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      {STYLE_PRESETS[polishStyle]?.name}风格 · 润色结果
                    </span>
                    <button
                      onClick={handleCopyPolish}
                      className="flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-300 hover:text-purple-500 transition-colors"
                    >
                      <Copy size={10} />
                      复制
                    </button>
                  </div>
                  <div className="text-xs text-ink-700 dark:text-ink-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {polishResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======== Tab 3: 引导式写作 ======== */}
          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-ink-700 dark:text-ink-200">
                  实时写作建议
                </span>
              </div>

              <p className="text-xs text-ink-400 dark:text-ink-300">
                输入你正在写的内容，AI 将提供关键词、句式思路和结构建议
              </p>

              <textarea
                value={guideInput}
                onChange={(e) => handleGuideInputChange(e.target.value)}
                placeholder="在这里开始写作...（输入后自动触发建议）"
                rows={5}
                className="w-full resize-none rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 px-3 py-2 text-xs text-ink-800 dark:text-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />

              {guideLoading && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <Loader2 size={12} className="animate-spin" />
                  正在分析写作内容...
                </div>
              )}

              {guideError && (
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-xs text-red-600">
                  {guideError}
                </div>
              )}

              {suggestions && !guideLoading && (
                <div className="space-y-3 animate-fade-in">
                  {suggestions.keywords.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-ink-400 dark:text-ink-300 uppercase tracking-wide mb-1.5">
                        推荐关键词
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {suggestions.keywords.map((kw, i) => (
                          <button
                            key={i}
                            onClick={() => handleInsertKeyword(kw)}
                            className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-[10px] text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                            title="点击插入到写作区"
                          >
                            + {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.nextSentenceHints.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-ink-400 dark:text-ink-300 uppercase tracking-wide mb-1.5">
                        接下来可以写...
                      </h4>
                      <div className="space-y-1.5">
                        {suggestions.nextSentenceHints.map((hint, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px] text-ink-600 dark:text-ink-300">
                            <CornerDownRight size={10} className="shrink-0 mt-0.5 text-amber-500" />
                            <span>{hint}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.structureTip && (
                    <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap size={10} className="text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">结构建议</span>
                      </div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-300">{suggestions.structureTip}</p>
                    </div>
                  )}

                  {suggestions.relatedAngle && (
                    <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap size={10} className="text-green-500" />
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400">换个角度</span>
                      </div>
                      <p className="text-[10px] text-green-600 dark:text-green-300">{suggestions.relatedAngle}</p>
                    </div>
                  )}
                </div>
              )}

              {!guideLoading && guideInput.trim() && !suggestions && (
                <button
                  onClick={() => fetchSuggestions(guideInput)}
                  className="w-full py-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  获取写作建议
                </button>
              )}
            </div>
          )}

          {/* ======== Tab 4: 素材分析 ======== */}
          {activeTab === 'analyze' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PieChart size={14} className="text-green-500" />
                <span className="text-xs font-bold text-ink-700 dark:text-ink-200">
                  素材智能分析
                </span>
              </div>

              {!fragmentAnalysis && (
                <>
                  {sortedFragments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                      <div className="w-12 h-12 rounded-2xl bg-ink-100 dark:bg-ink-800 flex items-center justify-center mb-3">
                        <PieChart size={20} className="text-ink-300 dark:text-ink-600" />
                      </div>
                      <p className="text-sm font-medium text-ink-600 dark:text-ink-300">暂无素材可供分析</p>
                      <p className="text-xs text-ink-400 dark:text-ink-400 mt-1 max-w-[200px]">
                        先记录一些写作素材，AI 会帮你发现它们之间的隐藏联系。
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-ink-400 dark:text-ink-300">
                        分析 {sortedFragments.length} 条素材的主题聚类、内在关联和缺失角度，帮你发现素材之间的隐藏联系。
                      </p>
                      <button
                        onClick={handleAnalyzeFragments}
                        disabled={analysisLoading}
                        className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-ink-200 dark:disabled:bg-ink-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        {analysisLoading ? (
                          <><Loader2 size={14} className="animate-spin" /> 分析中...</>
                        ) : (
                          <><GitBranch size={14} /> 开始分析</>
                        )}
                      </button>
                      {analysisError && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-xs text-red-600">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          {analysisError}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {fragmentAnalysis && (
                <div className="space-y-3 animate-fade-in">
                  {/* 总评 */}
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target size={12} className="text-green-600 dark:text-green-400" />
                      <span className="text-[10px] font-bold text-green-700 dark:text-green-400">整体评价</span>
                    </div>
                    <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed">
                      {fragmentAnalysis.summary}
                    </p>
                  </div>

                  {/* 主题聚类 */}
                  {fragmentAnalysis.clusters.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-ink-400 dark:text-ink-300 uppercase tracking-wide mb-2">
                        主题聚类（{fragmentAnalysis.clusters.length} 组）
                      </h4>
                      <div className="space-y-2">
                        {fragmentAnalysis.clusters.map((cluster, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-ink-700 dark:text-ink-200">{cluster.theme}</span>
                              <span className="text-[10px] text-ink-400 dark:text-ink-300">
                                素材 {cluster.fragmentIds.join(', ')}
                              </span>
                            </div>
                            <p className="text-[10px] text-ink-500 dark:text-ink-400">{cluster.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 素材关联 */}
                  {fragmentAnalysis.connections.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-ink-400 dark:text-ink-300 uppercase tracking-wide mb-2">
                        隐藏关联
                      </h4>
                      <div className="space-y-1.5">
                        {fragmentAnalysis.connections.map((conn, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] text-ink-600 dark:text-ink-300 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                            <GitBranch size={10} className="shrink-0 mt-0.5 text-amber-500" />
                            <span>素材{conn.from} ↔ 素材{conn.to}：{conn.relation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 缺失角度 */}
                  {fragmentAnalysis.missingAngles.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                      <h4 className="text-[10px] font-bold text-red-700 dark:text-red-400 mb-1.5">
                        缺失的角度（{fragmentAnalysis.missingAngles.length} 个）
                      </h4>
                      <ul className="space-y-1">
                        {fragmentAnalysis.missingAngles.map((angle, i) => (
                          <li key={i} className="text-[10px] text-ink-600 dark:text-ink-300 pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-red-500 before:font-bold">
                            {angle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 推荐顺序 */}
                  {fragmentAnalysis.suggestedOrder.length > 0 && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
                      <h4 className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-1.5">
                        推荐展开顺序
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {fragmentAnalysis.suggestedOrder.map((num, i) => (
                          <span key={i} className="inline-flex items-center gap-0.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                              素材 {num}
                            </span>
                            {i < fragmentAnalysis.suggestedOrder.length - 1 && (
                              <ArrowRight size={8} className="text-ink-300 dark:text-ink-600" />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyzeFragments}
                    disabled={analysisLoading}
                    className="w-full py-2 rounded-xl border border-ink-200 dark:border-ink-700 text-xs font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                  >
                    <RefreshCw size={12} className="inline mr-1" />
                    重新分析
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
