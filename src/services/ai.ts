import type { Fragment, WritingProject, ArticleOutput } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const PROXY_URL = `${API_BASE}/api/deepseek/v1/chat/completions`;
const MODEL = 'deepseek-chat';

// ============================================================
// 写作风格定义
// ============================================================

export type WritingStyle = 'modiano' | 'hemingway' | 'murakami' | 'zhangailing' | 'custom';

export interface GenerateOptions {
  style: WritingStyle;
  length: 'short' | 'medium' | 'long';
  audience: string;
  tone: string;
  customPrompt?: string;
  enableReview: boolean;
}

export const STYLE_PRESETS: Record<WritingStyle, { name: string; description: string; sample: string }> = {
  modiano: {
    name: '莫迪亚诺',
    description: '朦胧的记忆叙事，老照片般的质感',
    sample: '「我记得那是一个十一月的傍晚。圣米歇尔广场上的路灯刚刚亮起。空气中有一股潮湿的尘土味。或者那是另一个夜晚，我已经记不清了。」',
  },
  hemingway: {
    name: '海明威',
    description: '极简硬朗，冰山理论，短句直击',
    sample: '「他走进咖啡馆。外面在下雨。他点了一杯咖啡。咖啡是热的。」',
  },
  murakami: {
    name: '村上春树',
    description: '日常与超现实交织，爵士乐般的节奏',
    sample: '「1968年的秋天，我十七岁。那一年我听了三百七十二张唱片。确切地说，是三百七十二张。」',
  },
  zhangailing: {
    name: '张爱玲',
    description: '冷峻犀利的都市观察，华美而苍凉',
    sample: '「生命是一袭华美的袍，爬满了蚤子。这是她后来说的。说的时候嘴角微微上扬，像在讲别人的故事。」',
  },
  custom: {
    name: '自由风格',
    description: '自定义写作风格提示词',
    sample: '输入你的自定义风格描述...',
  },
};

export const DEFAULT_OPTIONS: GenerateOptions = {
  style: 'modiano',
  length: 'medium',
  audience: '一般读者',
  tone: 'literary',
  enableReview: true,
};

// ============================================================
// 风格专属 System Prompt
// ============================================================

function buildModianoPrompt(project: WritingProject): string {
  return `你是一位深受帕特里克·莫迪亚诺（Patrick Modiano）影响的作家。你的文字应当像一张被水浸湿的老照片——边缘模糊，中心清晰却带着一种难以言说的距离感。

## 必须做到的
1. 每段不超过4句话，制造呼吸感
2. 每句话不超过35个字，长短有致
3. 必须包含至少3个具体的物质细节：街道名字、气味、旧物、光线、电话号码、车票
4. 使用"记忆的不确定性"标记：我似乎记得、大概是、也许、我不确定
5. 至少2处时间跳跃
6. 结尾开放，不总结不升华

## 绝对禁止
感叹号、逻辑连接词（因为/所以）、形容词堆砌、直接情感表达、成语俗语、总结性语句

## 标志性元素（融合至少5个）
地铁站、咖啡馆、旧旅馆、雨中的橱窗、潮湿的墙壁、旧地址簿、褪色的照片、车票根、灰尘在光线中飞舞

## 句式节奏
- 记忆闪回："我记得那是一个[季节][时间]。[地点]。[感官细节]。[不确定的话]。"
- 物品叙事："[物品]。它属于[某人/时间]。[模糊记忆]。"
- 时间跳跃："[现在场景]。突然间，我想起了[过去场景]。[模糊联系]。"

## 标题
地名（如「圣拉扎尔车站」「暗店街」），或日常名词（如「蜜月」「回声」「空白页」），禁止概括性标题。

## 输出格式
Markdown 格式，## 标题 作为文章标题，--- 分隔正文和摘要（摘要≤100字）。`;
}

function buildHemingwayPrompt(project: WritingProject): string {
  return `你是欧内斯特·海明威（Ernest Hemingway）风格的写作者。你的文字像被海水冲刷过的石头——坚硬、简洁、不留多余的一丝痕迹。

## 铁律
1. 句子要短。非常短。主语+动词。不多一个字。
2. 每段不超过3句话。用空白来说话。
3. 只写看得见摸得着的东西。不解释。不评论。
4. 对话干净利落。他说。她说。不要加副词。
5. 情感全部藏在动作和物件的背后。人物做什么，而不是感受什么。
6. 至少3处重复——同一个词、同一个意象反复出现，像波浪拍打海岸。

## 绝对禁止
形容词堆砌、内心独白、心理分析、"觉得""认为""感到"等词、任何说教

## 核心技法
- 冰山理论：只写1/8，另外7/8在水下
- 重复的力量：像《老人与海》中反复出现的"大海""鱼""老人"
- 仪式感动作：点烟、倒酒、走路、看表——用动作承载一切

## 标题
简单直接：一个名词（「老人与海」「白象似的群山」）或一句对话片段（「在异乡」「一个干净明亮的地方」）

## 输出格式
Markdown 格式，## 标题 作为文章标题，--- 分隔正文和摘要（摘要≤100字）。`;
}

function buildMurakamiPrompt(project: WritingProject): string {
  return `你是村上春树（Haruki Murakami）风格的写作者。你的文字是爵士乐——即兴、优雅、在寻常中突然转入另一个世界。

## 必须做到的
1. 第一人称叙述，"我"始终在场
2. 数字精确到荒谬：372张唱片、16分32秒、7月14日下午3点
3. 日常细节与超现实的平滑过渡——煮意大利面时电话响了，电话那头没有人说话
4. 音乐、料理、酒——必须出现其中之一
5. 猫或者井。至少出现一个
6. 一段看似无关的比喻："就像把两块完全不同的拼图强行拼在一起"
7. 结尾留白，问号多于句号

## 绝对禁止
说教、道德判断、煽情、戏剧化冲突、英雄主义

## 语言节奏
- "我[日常动作]。然后[日常动作]。这大概就是所谓的[普通名词]。"
- 长句与短句交替，像爵士乐的切分音
- 反复出现的日常动作：煮面、听唱片、熨衣服、跑步

## 标题
音乐曲名、地名、或一个日常短语（「挪威的森林」「且听风吟」「海边的卡夫卡」「世界尽头与冷酷仙境」）

## 输出格式
Markdown 格式，## 标题 作为文章标题，--- 分隔正文和摘要（摘要≤100字）。`;
}

function buildZhangAilingPrompt(project: WritingProject): string {
  return `你是张爱玲风格的写作者。你的文字是华美的袍子——每一个比喻都锋利如刀，每一句都透着苍凉。

## 必须做到的
1. 比喻必须出人意料且精准——"生命是一袭华美的袍，爬满了蚤子"
2. 对颜色和衣物的描写要极其细腻：月白、葱绿、桃红、蟹壳青
3. 都市空间的精确描写：公寓、电车、咖啡馆、戏院
4. 每一段至少有一个"刺点"——让人停顿半秒的句子
5. 人情世故的冷眼旁观：不批判，但每一句都是审视
6. 时间感要强烈：旧时代的残影与新时代的冰凉交织

## 绝对禁止
温情脉脉、道德说教、直抒胸臆、英雄人物、大团圆

## 语言节奏
- 短句炸裂，长句婉转。像刺绣——密的地方极密，疏的地方大片空白。
- "他/她[动作]。[一个锋利的比喻]。[然后一切又恢复了平静]。"
- 描写光线：太阳光、电灯光、黄昏的光——每一种光都承载情绪

## 标题
短小有力的名词短语或意象（「金锁记」「倾城之恋」「红玫瑰与白玫瑰」「沉香屑」）

## 输出格式
Markdown 格式，## 标题 作为文章标题，--- 分隔正文和摘要（摘要≤100字）。`;
}

function buildStylePrompt(style: WritingStyle, project: WritingProject): string {
  switch (style) {
    case 'modiano': return buildModianoPrompt(project);
    case 'hemingway': return buildHemingwayPrompt(project);
    case 'murakami': return buildMurakamiPrompt(project);
    case 'zhangailing': return buildZhangAilingPrompt(project);
    case 'custom': return '';
  }
}

// ============================================================
// 通用 System Prompt 构建
// ============================================================

function buildSystemPrompt(project: WritingProject, options: GenerateOptions): string {
  const lengthMap: Record<string, string> = {
    short: '800-1200字左右的短文',
    medium: '1800-2500字的中篇文章',
    long: '3500-5000字的长文',
  };

  const stylePrompt = buildStylePrompt(options.style, project);
  const customAddition = options.style === 'custom' && options.customPrompt
    ? `\n## 自定义风格要求\n${options.customPrompt}\n`
    : '';

  const audienceGuidance = options.audience
    ? `\n目标读者：${options.audience}。请自动调整语言难度和引用内容。`
    : '';

  const lengthGuidance = `\n篇幅要求：${lengthMap[options.length] || lengthMap.medium}。`;

  return `${stylePrompt}${customAddition}
## 任务
用户提供了一系列围绕主题「${project.topic}」的碎片化笔记。

${lengthGuidance}${audienceGuidance}

请将这些素材重新编织成一篇文章。不要按顺序罗列——打散、重组，让它们像记忆碎片一样自然浮现。`;
}

// ============================================================
// User Prompt 构建
// ============================================================

function buildUserPrompt(fragments: Fragment[]): string {
  const sorted = [...fragments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const fragmentsText = sorted
    .map(
      (f, i) =>
        `### 素材片段 ${i + 1}${f.tags.length ? ` [${f.tags.join(', ')}]` : ''}${f.note ? ` [备注: ${f.note}]` : ''}\n${f.content}`
    )
    .join('\n\n');

  return `以下是我围绕主题收集的碎片化素材（共 ${fragments.length} 条）：

${fragmentsText}

---

不要在最终文章中保留"素材片段"的编号。将它们打散重组。`;
}

// ============================================================
// 解析
// ============================================================

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

// ============================================================
// SSE 流式读取
// ============================================================

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

// ============================================================
// 风格审查
// ============================================================

const REVIEW_PROMPT = `你是一位严格的文学风格审查者。请对以下文章进行多维度风格审查。

## 审查维度（百分制）

1. **风格一致度**（25分）：整体是否持续体现指定的写作风格？
2. **语言精炼度**（25分）：有无冗余词句、废话？句长控制是否得当？
3. **细节密度**（20分）：是否有足够的感官细节和具体描写？
4. **结构节奏**（15分）：段落长短、叙事节奏是否张弛有度？
5. **情感表达**（15分）：情感是否通过展示而非说教来表达？

## 输出格式

请严格按照以下JSON格式输出：
{
  "score": 85,
  "summary": "一句话总体评价（≤30字）",
  "breakdown": {
    "style_consistency": {"score": 22, "max": 25, "label": "风格一致度", "feedback": "一句话反馈"},
    "language_precision": {"score": 20, "max": 25, "label": "语言精炼度", "feedback": "一句话反馈"},
    "detail_density": {"score": 17, "max": 20, "label": "细节密度", "feedback": "一句话反馈"},
    "structure_rhythm": {"score": 13, "max": 15, "label": "结构节奏", "feedback": "一句话反馈"},
    "emotion_expression": {"score": 13, "max": 15, "label": "情感表达", "feedback": "一句话反馈"}
  },
  "highlights": ["亮点1", "亮点2"],
  "improvements": ["具体改进建议1", "建议2"]
}`;

export const REVIEW_DIMENSIONS = [
  { key: 'style_consistency', label: '风格一致度', max: 25 },
  { key: 'language_precision', label: '语言精炼度', max: 25 },
  { key: 'detail_density', label: '细节密度', max: 20 },
  { key: 'structure_rhythm', label: '结构节奏', max: 15 },
  { key: 'emotion_expression', label: '情感表达', max: 15 },
] as const;

// ============================================================
// 公开 API
// ============================================================

export async function generateArticle(
  project: WritingProject,
  fragments: Fragment[],
  options: GenerateOptions,
  hooks: {
    onThinking?: (text: string) => void;
    onContent?: (text: string) => void;
    onError?: (msg: string) => void;
    signal?: AbortSignal;
  } = {}
): Promise<ArticleOutput | null> {
  if (fragments.length === 0) {
    hooks.onError?.('请先添加一些写作素材');
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    hooks.onThinking?.('正在连接 AI...');

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(project, options) },
          { role: 'user', content: buildUserPrompt(fragments) },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
      signal: hooks.signal || controller.signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        (errData as { error?: { message?: string } }).error?.message || `请求失败 (${response.status})`
      );
    }

    hooks.onThinking?.('AI 正在写作中...');

    const fullText = await readSSEStream(
      response,
      (text) => hooks.onContent?.(text),
      hooks.signal || controller.signal
    );

    if (!fullText) {
      hooks.onError?.('AI 返回内容为空，请重试');
      return null;
    }

    const article = parseArticleText(fullText, project.topic);
    article.fragmentCount = fragments.length;
    return article;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      hooks.onError?.('操作已取消');
      return null;
    }
    const message = err instanceof Error ? err.message : '未知错误';
    hooks.onError?.(message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function reviewStyle(articleContent: string): Promise<{
  score: number;
  summary: string;
  breakdown: Record<string, { score: number; max: number; label: string; feedback: string }>;
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
          { role: 'system', content: '你是一位严格的文学风格审查专家。只输出 JSON 格式的结果。' },
          { role: 'user', content: REVIEW_PROMPT + '\n\n' + articleContent },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
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
  options: GenerateOptions,
  hooks: {
    signal?: AbortSignal;
    onError?: (msg: string) => void;
    onThinking?: (text: string) => void;
    onContent?: (text: string) => void;
    onReviewScore?: (score: number) => void;
    onReviewData?: (data: any) => void;
  } = {}
): Promise<{ article: ArticleOutput; reviewScore: number; reviewData?: any } | null> {
  hooks.onThinking?.('AI 正在写作中...');

  const article = await generateArticle(project, fragments, options, {
    onContent: hooks.onContent,
    onError: hooks.onError,
    signal: hooks.signal,
    onThinking: hooks.onThinking,
  });

  if (!article) return null;

  if (!options.enableReview) {
    return { article, reviewScore: 0 };
  }

  hooks.onThinking?.('正在审查风格...');

  const review = await reviewStyle(article.content);
  const reviewScore = review?.score ?? 0;
  hooks.onReviewScore?.(reviewScore);
  hooks.onReviewData?.(review);

  article.styleScore = reviewScore;
  if (review) {
    article.styleBreakdown = review.breakdown;
    article.styleHighlights = review.highlights;
    article.styleImprovements = review.improvements;
  }

  return { article, reviewScore, reviewData: review };
}

// ============================================================
// 根据反馈重写
// ============================================================

export async function rewriteWithUserFeedback(
  project: WritingProject,
  article: ArticleOutput,
  userFeedback: string,
  options: GenerateOptions,
  hooks: {
    signal?: AbortSignal;
    onThinking?: (text: string) => void;
    onError?: (msg: string) => void;
    onReviewScore?: (score: number) => void;
    onReviewData?: (data: any) => void;
  } = {}
): Promise<{ article: ArticleOutput; reviewScore: number; reviewData?: any } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  try {
    hooks.onThinking?.('正在理解修改需求...');

    const stylePrompt = buildStylePrompt(options.style, project);

    const userPrompt = `根据以下修改要求，重写这篇文章。只修改要求的部离，保持其他内容不变。

## 修改要求
${userFeedback}

## 原文标题
${article.title}

## 原文
${article.content}

用 Markdown 格式输出，## 标题 作为文章标题，--- 分隔正文和摘要。`;

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: stylePrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.65,
        max_tokens: 4096,
        stream: false,
      }),
      signal: hooks.signal || controller.signal,
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
      hooks.onError?.('AI 返回内容为空，请重试');
      return null;
    }

    const revisedArticle = parseArticleText(fullText, article.title);
    revisedArticle.fragmentCount = article.fragmentCount;

    if (!options.enableReview) {
      return { article: revisedArticle, reviewScore: 0 };
    }

    hooks.onThinking?.('正在审查修改后的风格...');
    const review = await reviewStyle(revisedArticle.content);
    const reviewScore = review?.score ?? 0;
    hooks.onReviewScore?.(reviewScore);
    hooks.onReviewData?.(review);

    revisedArticle.styleScore = reviewScore;
    if (review) {
      revisedArticle.styleBreakdown = review.breakdown;
      revisedArticle.styleHighlights = review.highlights;
      revisedArticle.styleImprovements = review.improvements;
    }

    return { article: revisedArticle, reviewScore, reviewData: review };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      hooks.onError?.('操作已取消');
      return null;
    }
    const message = err instanceof Error ? err.message : '未知错误';
    hooks.onError?.(message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
