import type { Fragment, WritingProject, ArticleOutput } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PROXY_URL = `${API_BASE}/api/deepseek/v1/chat/completions`;
const MODEL = 'deepseek-chat';

interface AIOptions {
  onThinking?: (text: string) => void;
  onContent?: (text: string) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

function buildSystemPrompt(project: WritingProject): string {
  const lengthMap = {
    short: '800-1200字左右的短文',
    medium: '2000-3000字的中篇文章',
    long: '4000-6000字的长文',
  };
  const toneMap = {
    casual: '轻松随和、口语化',
    professional: '专业严谨、条理清晰',
    academic: '学术化、逻辑严密',
    storytelling: '叙事性强、富有感染力',
  };

  return `你是一位资深的编辑和作家，擅长将零散的写作素材整合为结构完整、行文流畅的文章。

## 任务
用户提供了一系列围绕同一主题的碎片化笔记，你需要将它们整合优化为一篇完整的文章。

## 写作要求
- 文章主题：${project.topic}
- 目标读者：${project.targetAudience || '一般读者'}
- 篇幅要求：${lengthMap[project.targetLength] || '1500-2000字'}
- 语气风格：${toneMap[project.tone] || '自然流畅'}
- 保留用户素材中的核心观点和精彩表达
- 补充必要的过渡和逻辑连接
- 为文章拟定一个吸引人的标题
- 结构完整：包括开头（引入主题）、主体（论点/素材展开）、结尾（总结/升华）
- 在整合后的文章末尾，添加一段简短的文章摘要

## 输出格式
请用 Markdown 格式输出，## 标题 作为文章标题，--- 分隔文章和摘要。`;
}

function buildUserPrompt(fragments: Fragment[]): string {
  const sorted = [...fragments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const fragmentsText = sorted
    .map(
      (f, i) =>
        `### 素材片段 ${i + 1}${f.tags.length ? ` [标签: ${f.tags.join(', ')}]` : ''}${f.note ? ` [备注: ${f.note}]` : ''}\n${f.content}`
    )
    .join('\n\n');

  return `以下是我围绕主题收集的碎片化素材（共 ${fragments.length} 条）。请将它们整合优化为一篇完整的文章。

${fragmentsText}

---
请按照系统提示中的要求，将这些素材整合为一篇完整的文章。`;
}

export async function generateArticle(
  project: WritingProject,
  fragments: Fragment[],
  options: AIOptions = {}
): Promise<ArticleOutput | null> {
  if (fragments.length === 0) {
    options.onError?.('请先添加一些写作素材');
    return null;
  }

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(project) },
          { role: 'user', content: buildUserPrompt(fragments) },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        (errData as { error?: { message?: string } }).error?.message || `请求失败 (${response.status})`
      );
    }

    const data = await response.json();
    const fullText: string = data.choices?.[0]?.message?.content || '';

    if (!fullText) {
      options.onError?.('AI 返回内容为空，请重试');
      return null;
    }

    // Parse the response: title (## ...), content, ---, summary
    let title = project.topic || '未命名文章';
    let content = fullText;
    let summary = '';

    // Extract title from first ## heading
    const titleMatch = fullText.match(/^##\s+(.+?)[\n\r]/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      content = fullText.slice(titleMatch[0].length).trim();
    }

    // Extract summary after --- separator
    const separatorIdx = content.lastIndexOf('\n---\n');
    if (separatorIdx > 0) {
      summary = content.slice(separatorIdx + 5).trim();
      content = content.slice(0, separatorIdx).trim();
    }

    const article: ArticleOutput = {
      title,
      content,
      summary,
      generatedAt: new Date().toISOString(),
      fragmentCount: fragments.length,
    };

    return article;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null;
    }
    const message = err instanceof Error ? err.message : '未知错误';
    options.onError?.(message);
    return null;
  }
}
