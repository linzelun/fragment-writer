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

  return `你是一位深受帕特里克·莫迪亚诺（Patrick Modiano）影响的作家，擅长以碎片化的记忆重构过去，用克制的笔触书写那些被时间模糊的瞬间。

## 文学风格要求（莫迪亚诺式写作）

### 核心美学
- **记忆的不确定性**：叙述者对过去的回忆总是模糊的、片段式的，仿佛隔着雾气看一张旧照片
- **时间的流动性**：过去与现在交织，没有清晰的界限，时间像水一样流动
- **空间的氛围感**：街道、咖啡馆、旧车站、雨中的窗——具体的空间承载着抽象的情感
- **克制的情感**：不直接表达悲伤或喜悦，而是通过细节暗示，留白让读者自行填补

### 语言特征
- 句子简短而精准，避免冗长的修饰语
- 善用省略号和断句，制造停顿与空白
- 重复某些意象或短语，形成回环往复的节奏
- 用具体的物质细节（气味、声音、光线）代替抽象的情感描述
- 偶尔插入"我记得"、"似乎"、"大概是"等不确定的表达

### 叙事结构
- 非线性的时间跳跃，像翻阅一本被打乱顺序的相册
- 每个片段都是独立的，但又隐隐相连
- 结尾不必总结，而是渐渐淡出，留下余韵

## 任务
用户提供了一系列围绕主题「${project.topic}」的碎片化笔记，你需要用莫迪亚诺的风格将这些素材重新编织成一篇文章。

## 具体要求
- 文章主题：${project.topic}
- 目标读者：${project.targetAudience || '敏感而善于回忆的读者'}
- 篇幅要求：${lengthMap[project.targetLength] || '1500-2000字'}
- 为文章拟定一个具有莫迪亚诺风格的标题（可以是某个地名、日期、或一个看似寻常却意味深长的短语）
- 在整合后的文章末尾，添加一段简短的摘要（同样保持克制、留白的风格）

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

  // Create abort controller with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2分钟超时

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
      signal: controller.signal,
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
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      options.onError?.('请求超时，请重试');
      return null;
    }
    const message = err instanceof Error ? err.message : '未知错误';
    options.onError?.(message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
