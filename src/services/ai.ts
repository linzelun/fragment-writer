import type { Fragment, WritingProject, ArticleOutput } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const PROXY_URL = `${API_BASE}/api/deepseek/v1/chat/completions`;
const MODEL = 'deepseek-chat';

interface AIOptions {
  onThinking?: (text: string) => void;
  onContent?: (text: string) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

interface GenerateWithReviewOptions {
  signal?: AbortSignal;
  onError?: (msg: string) => void;
  onThinking?: (text: string) => void;
  onContent?: (text: string) => void;
  onReviewScore?: (score: number) => void;
}

function buildSystemPrompt(project: WritingProject): string {
  const lengthMap = {
    short: '800-1200字左右的短文',
    medium: '2000-3000字的中篇文章',
    long: '4000-6000字的长文',
  };

  return `你是一位深受帕特里克·莫迪亚诺（Patrick Modiano）影响的作家。你的文字应当像一张被水浸湿的老照片——边缘模糊，中心清晰却带着一种难以言说的距离感。

# 莫迪亚诺式写作指南

## 一、你必须遵守的铁律

### ✅ 必须做到的
1. **每段不超过4句话**。短段落制造呼吸感和空白。
2. **每句话不超过35个字**。句子应自然舒展，长短有致，避免刻意截断。
3. **必须包含至少3个具体的物质细节**：一个街道名字、一种气味、一件旧物、一束光线、一个电话号码、一张车票……这些细节必须是可触摸的。
4. **必须使用"记忆的不确定性"标记**：每隔一段就插入"我似乎记得"、"大概是"、"也许"、"我不确定"等表达。
5. **必须有至少2处时间跳跃**：从现在跳到十年前，再从十年前跳到某个更早的下午。
6. **结尾必须是开放的**：不要总结，不要升华，不要给出答案。以一个细节或一个问题结束。

### ❌ 绝对禁止的
1. 禁止使用感叹号！（莫迪亚诺从不激动）
2. 禁止使用"因为"、"所以"、"因此"等逻辑连接词
3. 禁止使用形容词堆砌（如"美丽的、温暖的、令人感动的"）
4. 禁止直接表达情感（如"我很伤心"、"他很高兴"）
5. 禁止使用成语和俗语
6. 禁止使用"首先、其次、最后"等结构化表达
7. 禁止总结性语句（如"这件事让我明白了..."）

## 二、莫迪亚诺的标志性元素库

请在文章中自然地融入以下元素中的至少5个：

| 类别 | 元素示例 |
|------|---------|
| **空间** | 地铁站、咖啡馆、旧旅馆、雨中的橱窗、昏暗的门厅、空旷的广场、有轨电车、旧书店 |
| **时间标记** | 某年某月的一个下午、某个冬日的黄昏、1968年的秋天、一个不知名的星期二 |
| **物品** | 旧地址簿、褪色的照片、车票根、打火机、钥匙、旧报纸、笔记本、眼镜 |
| **感官** | 雨水的气味、潮湿的墙壁、远处的钟声、煤气的味道、灰尘在光线中飞舞 |
| **人物特征** | 匿名者、只有姓氏的人、消失的人、"那个人"、影子般的存在 |
| **氛围词** | 朦胧、模糊、遥远、消逝、遗忘、痕迹、回声、灰烬、雾气 |

## 三、句式模板（请模仿这种节奏）

### 模板A - 记忆闪回
> "我记得那是一个[季节]的[时间段]。[地点]。[感官细节]。[一句不确定的话]。"

例："我记得那是一个十一月的傍晚。圣米歇尔广场上的路灯刚刚亮起。空气中有一股潮湿的尘土味。或者那是另一个夜晚，我已经记不清了。"

### 模板B - 物品叙事
> "[物品]。它属于[某人/某段时间]。[关于这个物品的模糊记忆]。"

例："那本黑色封皮的地址簿。它大概是从1968年起就放在那个抽屉里了。里面的名字大多已经变成了陌生人，或者更糟——变成了没有面孔的名字。"

### 模板C - 时间跳跃
> "[现在的场景]。突然间，我想起了[过去的场景]。[两个场景之间的模糊联系]。"

例："窗外的雨还在下。我突然想起了十五年前在布洛涅森林边的那个下午。同样是这样的雨。同样有这样的寂静。但那时我还不知道某些事情。"

### 模板D - 克制的情感
> 不要说"他很伤心"，要说：
> "他点燃了一支烟。烟雾在灯光下缓缓上升。他没有说话。那一整个晚上，他只说了三句话。"

### 模板E - 开放式结尾
> 不要说"我终于明白了人生的意义"，要以一个细节结束：
> "远处传来火车的汽笛声。很轻，像是从另一个城市传来的。然后一切又恢复了寂静。"

## 四、文章结构要求

不要写传统的"开头-中间-结尾"。请采用以下结构：

1. **入口**（1-2段）：从一个具体的、看似无关的细节开始（如一个电话号码、一张照片）
2. **碎片展开**（主体部分）：将用户的素材打散，穿插着回忆、疑问、不确定
3. **反复出现**（2-3次）：让某个意象或短语重复出现，每次略有不同
4. **淡出**（最后1-2段）：不总结，而是渐渐消失在一个画面或声音中

## 五、标题要求

标题必须是以下类型之一：
- 一个地名（不加时间标注，如「圣拉扎尔车站」「暗店街」「布洛涅森林」）
- 一个看似平常却暗含深意的名词或短语（如「蜜月」「缓刑」「隐形墨水」）
- 一个人名或人称（如「多拉」「那个穿灰色大衣的男人」）
- 一个唤起画面感的普通词语（如「门槛」「回声」「空白页」）

绝对禁止使用概括性标题（如"我的回忆"、"关于XX的思考"、"一次难忘的经历"）。

---

## 任务
用户提供了一系列围绕主题「${project.topic}」的碎片化笔记。请用上述莫迪亚诺写作指南，将这些素材重新编织成一篇文章。

## 具体参数
- 文章主题：${project.topic}
- 目标读者：${project.targetAudience || '那些习惯在旧时光中徘徊的人'}
- 篇幅要求：${lengthMap[project.targetLength] || '1500-2000字'}

## 输出格式
用 Markdown 格式输出。## 标题 作为文章标题，--- 分隔文章和摘要。摘要同样保持克制、留白，不超过100字。`;
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

  return `以下是我围绕主题收集的碎片化素材（共 ${fragments.length} 条）。它们像散落在旧抽屉里的照片——有些清晰，有些模糊。

${fragmentsText}

---

**写作提醒：**
- 不要按顺序罗列这些素材。把它们打散、重组，让它们像记忆碎片一样自然浮现。
- 在素材之间插入"空白时间"——那些没有记录下来的时刻。
- 让某些素材反复出现，每次出现时略有不同（就像同一张照片在不同光线下看）。
- 如果某些素材与主题看似无关，不要删除它——莫迪亚诺的故事里总有一些无法解释的细节。

请按照系统提示中的莫迪亚诺写作指南，将这些素材编织成一篇文章。`;
}

function parseArticleText(fullText: string, defaultTitle: string): ArticleOutput {
  let title = defaultTitle || '未命名文章';
  let content = fullText;
  let summary = '';

  const titleMatch = fullText.match(/^##\s+(.+?)[\n\r]/);
  if (titleMatch) {
    title = titleMatch[1].trim();
    content = fullText.slice(titleMatch[0].length).trim();
  }

  const separatorIdx = content.lastIndexOf('\n---\n');
  if (separatorIdx > 0) {
    summary = content.slice(separatorIdx + 5).trim();
    content = content.slice(0, separatorIdx).trim();
  }

  return {
    title,
    content,
    summary,
    generatedAt: new Date().toISOString(),
    fragmentCount: 0,
  };
}

async function readSSEStream(
  response: Response,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('不支持流式读取');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') continue;

        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(fullText);
          }
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    options.onThinking?.('正在连接 AI...');

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
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        (errData as { error?: { message?: string } }).error?.message || `请求失败 (${response.status})`
      );
    }

    options.onThinking?.('AI 正在写作中...');

    const fullText = await readSSEStream(
      response,
      (text) => {
        options.onContent?.(text);
      },
      controller.signal
    );

    if (!fullText) {
      options.onError?.('AI 返回内容为空，请重试');
      return null;
    }

    const article = parseArticleText(fullText, project.topic);
    article.fragmentCount = fragments.length;
    return article;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      options.onError?.('操作已取消');
      return null;
    }
    const message = err instanceof Error ? err.message : '未知错误';
    options.onError?.(message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

const REVIEW_PROMPT = `你是一位帕特里克·莫迪亚诺风格的严格审查者。请对以下文章进行风格审查。

## 审查维度（每项满分，总分100分）

1. **记忆不确定性**（20分）：是否使用"似乎"、"大概"、"我记得"等不确定表达？
2. **句子长度控制**（15分）：平均句长≤35字？句子长短有致，不过度碎片化？
3. **物质细节密度**（20分）：每200字≥1个可触摸的具体细节？
4. **情感克制度**（15分）：避免直接情感表达？展示而非讲述？
5. **时间跳跃**（10分）：≥2次非线性时间跳跃？
6. **开放性结尾**（10分）：以细节/画面结束而非总结？
7. **禁止项违规**（-10分/项）：感叹号/逻辑连接词/形容词堆砌/成语/总结性语句

## 输出格式

请严格按照以下JSON格式输出（不要输出其他内容）：
{
  "score": 数字,
  "breakdown": {
    "memory_uncertainty": {"score": 数字, "feedback": "具体反馈"},
    "sentence_length": {"score": 数字, "feedback": "具体反馈"},
    "material_details": {"score": 数字, "feedback": "具体反馈"},
    "emotional_restraint": {"score": 数字, "feedback": "具体反馈"},
    "time_jumps": {"score": 数字, "feedback": "具体反馈"},
    "open_ending": {"score": 数字, "feedback": "具体反馈"},
    "violations": {"score": 数字, "count": 数字, "items": ["违规项列表"]}
  },
  "highlights": ["符合风格的亮点1", "亮点2", "亮点3"],
  "improvements": ["改进建议1", "建议2"]
}

## 待审查文章

`;

export const DIMENSION_MAX_SCORES: Record<string, number> = {
  memory_uncertainty: 20,
  sentence_length: 15,
  material_details: 20,
  emotional_restraint: 15,
  time_jumps: 10,
  open_ending: 10,
  violations: 0,
};

export async function reviewStyle(articleContent: string): Promise<{
  score: number;
  breakdown: Record<string, any>;
  highlights: string[];
  improvements: string[];
} | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: '你是一位严格的文学风格审查专家。只输出JSON格式的结果，不要输出其他内容。' },
          { role: 'user', content: REVIEW_PROMPT + articleContent },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        for (const [dim, data] of Object.entries(result.breakdown || {})) {
          const maxScore = DIMENSION_MAX_SCORES[dim];
          const entry = data as { score?: number };
          if (maxScore !== undefined && typeof entry.score === 'number') {
            if (dim === 'violations') {
              entry.score = Math.min(0, Math.max(-10, entry.score));
            } else {
              entry.score = Math.min(maxScore, Math.max(0, entry.score));
            }
          }
        }
        return result;
      }
    } catch {}
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateWithReview(
  project: WritingProject,
  fragments: Fragment[],
  options: GenerateWithReviewOptions = {}
): Promise<{ article: ArticleOutput; reviewScore: number; reviewData?: any } | null> {
  options.onThinking?.('AI 正在写作中...');

  const article = await generateArticle(project, fragments, {
    onContent: options.onContent,
    onError: options.onError,
    signal: options.signal,
    onThinking: (text) => {
      if (text === 'AI 正在写作中...') {
        options.onThinking?.('AI 正在写作中...');
      } else {
        options.onThinking?.(text);
      }
    },
  });

  if (!article) return null;

  options.onThinking?.('正在审查风格...');

  const review = await reviewStyle(article.content);
  const reviewScore = review?.score ?? 70;
  options.onReviewScore?.(reviewScore);

  article.styleScore = reviewScore;
  if (review) {
    article.styleBreakdown = review.breakdown;
    article.styleHighlights = review.highlights;
    article.styleImprovements = review.improvements;
  }

  return { article, reviewScore, reviewData: review };
}

const USER_FEEDBACK_REWRITE_PROMPT = `你是一位深受帕特里克·莫迪亚诺（Patrick Modiano）影响的作家。

请根据用户的修改建议，对以下文章进行针对性修改。

## 修改原则
1. 忠实执行用户的具体修改要求，这些要求是你的最高优先级指令
2. 在满足用户要求的前提下，保持莫迪亚诺的写作风格
3. 只修改用户要求的部分，保持其他内容不变
4. 保持文章的篇幅和整体结构
5. 使用 Markdown 格式输出，## 标题 作为文章标题

## 用户修改要求

{USER_FEEDBACK}

## 原文

标题：{ARTICLE_TITLE}

{ARTICLE_CONTENT}
`;

export async function rewriteWithUserFeedback(
  project: WritingProject,
  article: ArticleOutput,
  userFeedback: string,
  options: {
    signal?: AbortSignal;
    onThinking?: (text: string) => void;
    onError?: (msg: string) => void;
    onReviewScore?: (score: number) => void;
  } = {}
): Promise<{ article: ArticleOutput; reviewScore: number; reviewData?: any } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    options.onThinking?.('正在理解您的修改需求...');

    const userPrompt = USER_FEEDBACK_REWRITE_PROMPT
      .replace('{USER_FEEDBACK}', userFeedback)
      .replace('{ARTICLE_TITLE}', article.title)
      .replace('{ARTICLE_CONTENT}', article.content);

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(project) },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.65,
        max_tokens: 4096,
        stream: false,
      }),
      signal: options.signal || controller.signal,
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

    const revisedArticle = parseArticleText(fullText, article.title);
    revisedArticle.fragmentCount = article.fragmentCount;

    options.onThinking?.('正在审查修改后的风格...');
    const review = await reviewStyle(revisedArticle.content);
    const reviewScore = review?.score ?? 70;
    options.onReviewScore?.(reviewScore);

    revisedArticle.styleScore = reviewScore;
    if (review) {
      revisedArticle.styleBreakdown = review.breakdown;
      revisedArticle.styleHighlights = review.highlights;
      revisedArticle.styleImprovements = review.improvements;
    }

    return { article: revisedArticle, reviewScore, reviewData: review };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      options.onError?.('操作已取消');
      return null;
    }
    const message = err instanceof Error ? err.message : '未知错误';
    options.onError?.(message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
