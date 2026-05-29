import type { Fragment, WritingProject, ArticleOutput } from '../types';
import { buildStylePrompt, STYLE_PRESETS, LITERARY_SUB_STYLES } from './ai-enhanced';

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
  literarySubStyle?: string | null;
}

/* ============================================================
   风格系统

   根据项目的 tone 字段选择写作风格：
   - casual       → 口语随笔
   - professional → 深度长文
   - academic     → 学术思辨
   - storytelling → 文学叙事（含莫迪亚诺/沈从文/张爱玲子风格）

   旧版硬编码的莫迪亚诺风格现已整合为文学叙事的一个子选项。
   ============================================================ */

function buildSystemPrompt(project: WritingProject, literarySubStyle?: string | null): string {
  const lengthMap: Record<string, string> = {
    short: '800-1200字左右的短文',
    medium: '2000-3000字的中篇文章',
    long: '4000-6000字的长文',
  };

  const tone = project.tone || 'casual';
  const styleName = STYLE_PRESETS[tone]?.name || '口语随笔';
  const baseStyleGuide = buildStylePrompt(tone);

  // 文学叙事风格追加子风格指南
  let styleSection = baseStyleGuide;
  if (tone === 'storytelling' && literarySubStyle) {
    const subStyleInfo = LITERARY_SUB_STYLES.find(s => s.key === literarySubStyle);
    const subGuide = buildLiterarySubStyleSystemPrompt(literarySubStyle);
    styleSection = `${baseStyleGuide}\n\n## 本次采用的具体风格：${subStyleInfo?.name || literarySubStyle}\n${subGuide}`;
  }

  return `你是一位专业的中文写作者。请按照以下风格完成写作任务。

# 写作风格：${styleName}

${styleSection}

# 文章参数
- 写作主题：${project.topic}
- 目标读者：${project.targetAudience || '广泛的阅读者'}
- 篇幅要求：${lengthMap[project.targetLength] || '1500-2000字'}
- 风格名称：${styleName}

# 通用写作原则
1. 用具体代替抽象——能用细节说明的，不用概念概括
2. 让读者感受，而不是告诉读者该感受什么
3. 中文写作特有的节奏感——长短句交错，像呼吸一样自然
4. 开头要有钩子，结尾要有余味
5. 删除所有可有可无的字、句、段

# 输出格式
用 Markdown 格式输出。以 ## 标题 作为文章标题。在文章末尾用 --- 分隔，之后附上摘要（不超过100字）。`;
}

function buildLiterarySubStyleSystemPrompt(subStyle: string): string {
  const guides: Record<string, string> = {
    modiano: `
## 莫迪亚诺式记忆叙事 — 写作铁律

### 必须做到
1. **长短句交错，以长句为主**：全文约 10%–20% 的句子为较长句（25–55 字），其中约 2%–5% 为含从句、插入语或并列结构的长难句；短句（15 字以内）只作节奏点缀，**禁止**通篇碎句、一句一行的电报体。
2. **段落有呼吸，但不碎**：每段 3–6 句；可用一个长句承载时间推移或场景铺陈，再用短句收束画面。
3. **长句写法**：用逗号、破折号、分号自然串联记忆、地点与感官；允许「当……的时候」「在……之后」「仿佛」等舒缓连接，但避免论文式「因为/所以/因此」。
4. 必须包含至少 3 个具体的物质细节：街道名、气味、旧物、光线、车票等。
5. 必须使用「记忆的不确定性」：适度穿插「我似乎记得」「大概是」「也许」「我不确定」。
6. 至少 2 处时间跳跃：从现在到几年前，再到更早的某个下午。
7. 结尾开放：不总结、不升华，以一个细节、画面或悬置的问题结束。

### 绝对禁止
- 感叹号
- 通篇不超过 15 字的碎句堆砌
- 形容词堆砌、成语俗语
- 直接情感宣泄（「我很伤心」「他很高兴」）
- 「首先、其次、最后」等提纲式结构
- 总结性语句（「这件事让我明白了……」）

### 标志性元素
旧地址簿、褪色照片、车票根、雨水气味、潮湿墙壁、远处钟声、灰尘在光线里缓慢下沉。

### 句式参考（注意长句舒展，勿拆成碎句）
- 记忆闪回：「我似乎记得那是个潮湿的十一月，巴黎北站附近某条记不清名字的小街，雨停在屋檐上，而我还站在候车厅门口，看着一张早已褪色的车票。」
- 物品叙事：「那本地址簿躺在抽屉最底层，纸页发黄，字迹被岁月磨淡，我翻到时仍无法确定，那些名字是否还曾真实地活过。」
- 收束：「远处传来火车的汽笛，很轻，像从另一个城市传来，然后一切又归于寂静。」
`,

    shencongwen: `
## 沈从文式乡土诗意 — 写作铁律

### 必须做到
1. 白描手法——只写看到的、听到的、闻到的，不评论、不议论
2. 节奏从容——句子像河水的流速，不急促不拖沓，有留白
3. 写人——只写他说了什么、做了什么、穿着什么、什么表情。不写"他是一个善良的人"
4. 写景——多用名词和动词，少用形容词。"月亮升起来了"比"皎洁的月光洒满大地"好十倍
5. 对话简短，带一点生活气息，但不刻意用力言
6. 结尾像镜头慢慢拉远——人变小了，天地变大了，声音远了

### 绝对禁止
- 形容词堆砌——一个名词配一个形容词就够了
- 大段的心理描写——中国人的情感在行动和对话里
- 道德评判——不评判人物的善恶，只呈现他们的选择和命运
- 戏剧化的情节——不要刻意制造冲突，生活本身已经足够动人
`,

    zhangailing: `
## 张爱玲式冷峻精准 — 写作铁律

### 必须做到
1. 语言精准到每一个字——可删的字统统删掉，每个留下来的词都必须承载意义
2. 善用通感——颜色有温度，声音有形状，气味有颜色
3. 洞察藏在细节里——不说"他们是虚伪的中产阶级"，写餐桌上一个不经意的眼神或一句话
4. 比喻要有杀伤力——让人读完后需要停下来喘口气的那种
5. 写情感时尤其克制——越激烈的情感越要轻描淡写，甚至用一个完全不相干的细节来写
6. 结尾是"反高潮"——在读者期待升华、感动、总结的时候，突然降落回日常

### 绝对禁止
- 浪漫化的描写——张爱玲不相信浪漫，她相信的是"华美的袍上爬满了虱子"
- 抒情的感叹——没有"啊"和"！"
- 直白的心理描写——不写"她觉得孤独"，写"她一个人在房间里坐了很久，没有开灯"
- 大团圆的结局——结尾往往是遗憾、错过或荒凉
`,

  };

  return guides[subStyle] || guides.modiano;
}

function buildUserPrompt(fragments: Fragment[], baseArticle?: ArticleOutput): string {
  const sorted = [...fragments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const fragmentsText = sorted
    .map(
      (f, i) =>
        `### 素材片段 ${i + 1}${f.tags.length ? ` [标签: ${f.tags.join(', ')}]` : ''}${f.note ? ` [备注: ${f.note}]` : ''}\n${f.content}`
    )
    .join('\n\n');

  const baseSection = baseArticle
    ? `以下是我已有的文章基础，请在此基础上结合新素材进行改写和扩充：

${baseArticle.content}

---\n\n新素材：` : '';

  return `${baseSection}以下是我围绕主题收集的碎片化素材（共 ${fragments.length} 条）：

${fragmentsText}

---

**写作提醒：**
- 不要按顺序罗列这些素材。把它们打散、重组，让它们像思维的自然流动一样出现。
- 在素材之间插入你自己的思考和过渡——素材是砖，你的思考是水泥。
- 如果某些素材与主题看似无关，思考一下它们之间有没有隐藏的联系。最好的写作往往发现别人没看到的关联。
- 不是所有素材都必须用上——选择最有力量的，其余可以舍弃。
${baseArticle ? '- **特别注意**：请基于已有文章基础进行改写，保留有价值的段落，融入新素材，形成更完整的文章。' : ''}

请按照系统提示中的风格要求，将这些素材编织成一篇文章。`;
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

/* ============================================================
   文章生成
   ============================================================ */

export async function generateArticle(
  project: WritingProject,
  fragments: Fragment[],
  options: AIOptions & { literarySubStyle?: string | null; baseArticle?: ArticleOutput } = {}
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
          { role: 'system', content: buildSystemPrompt(project, options.literarySubStyle) },
          { role: 'user', content: buildUserPrompt(fragments, options.baseArticle) },
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

/* ============================================================
   风格评分 — 适配多种风格

   评分维度根据 tone 动态调整：
   - 口语随笔：自然度、细节感、节奏感、真诚度
   - 深度长文：结构清晰度、信息密度、论证力、可读性
   - 学术思辨：概念清晰度、论证层次、引用恰当、开放度
   - 文学叙事：细节密度、情感克制、时间处理、结尾质量
   ============================================================ */

export const DIMENSION_MAX_SCORES: Record<string, number> = {
  // 通用
  language_quality: 20,
  structure: 15,
  detail_density: 15,
  reader_engagement: 15,
  style_consistency: 15,
  ending_quality: 10,
  // 违规扣分
  violations: 0,
};

function buildReviewPrompt(tone: string): string {
  const toneName = STYLE_PRESETS[tone]?.name || '口语随笔';

  const criteriaByTone: Record<string, string> = {
    casual: `
## 评分维度（口语随笔风格）

1. **自然度**（20分）：读起来像不像真人在说话？有没有"作文腔"或"翻译腔"？
2. **细节感**（15分）：有没有具体的生活细节？是"一碗面"还是"美食"？
3. **节奏感**（15分）：句子长短错落是否舒服？有没有大段长句让人喘不过气？
4. **真诚度**（15分）：是在真实地分享一个想法，还是在表演"我很真诚"？
5. **趣味性**（15分）：有没有让人会心一笑的地方？有没有自嘲或意外的转折？
6. **结尾余味**（10分）：结尾是自然停顿还是强行升华？
7. **扣分项**：感叹号滥用(-2/个)、鸡汤句式(-5/次)、大词空话(-3/次)
`,

    professional: `
## 评分维度（深度长文风格）

1. **观点清晰度**（20分）：核心观点是否明确？能不能用一句话概括这篇文章说了什么？
2. **论证力**（15分）：观点是否有数据/案例/逻辑支撑？有没有"我觉得"代替论证？
3. **结构清晰度**（15分）：读者能否轻松跟随你的论证路径？
4. **信息密度**（15分）：有没有水分段落？每段是否都有信息增量？
5. **可读性**（15分）：专业但不说教，深入但不晦涩
6. **结尾力度**（10分）：结尾是否有分量？有没有留下值得继续思考的命题？
7. **扣分项**：套话开头(-5/次)、"首先其次最后"机械结构(-3/次)、术语堆砌(-3/次)
`,

    academic: `
## 评分维度（学术思辨风格）

1. **问题意识**（20分）：有没有一个真正值得思考的问题驱动全文？
2. **概念清晰度**（15分）：核心概念是否被充分辨析？读者能否理解你在说什么？
3. **论证层次**（15分）：论证是否有推进感？是罗列观点还是展示思考过程？
4. **学术公共性**（15分）：是否在学术严谨和公共可读之间取得了平衡？
5. **思辨深度**（15分）：有没有超越常识的洞察？有没有挑战读者的既有认知？
6. **开放结论**（10分）：结尾是给出终极答案，还是打开新的问题空间？
7. **扣分项**：学术黑话(-3/次)、用引用代替论证(-5/次)、"众所周知"等跳过论证的修辞(-3/次)
`,

    storytelling: `
## 评分维度（文学叙事风格）

1. **细节密度**（20分）：每200字是否有至少1个具体、可触摸的细节？
2. **情感克制**（15分）：是否做到了展示而非说教？情感是否藏在场景和动作里？
3. **语言精准度**（15分）：每个词是否都承载意义？长短句是否有节奏（莫迪亚诺子风格应含适量长句与长难句，勿因句长而扣分）？
4. **时间处理**（15分）：时间线是否有趣味？有没有闪回、跳跃、或意味深长的停顿？
5. **留白艺术**（15分）：有没有给读者留下感受和思考的空间？
6. **结尾质量**（10分）：结尾是否有余味？是开放式、画面式、还是强行总结？
7. **扣分项**：通篇碎句堆砌(-5/次)、形容词堆砌(-3/次)、直接情感表达(-5/次)、成语俗语(-2/次)、总结性语句(-5/次)
`,
  };

  const criteria = criteriaByTone[tone] || criteriaByTone.casual;

  return `你是一位严格的写作风格审查者。请对以下文章进行风格审查。

目标风格：${toneName}
${criteria}

## 输出格式

请严格按照以下JSON格式输出（不要输出其他内容）：
{
  "score": 数字,
  "breakdown": {
    "language_quality": {"score": 数字, "feedback": "具体反馈"},
    "structure": {"score": 数字, "feedback": "具体反馈"},
    "detail_density": {"score": 数字, "feedback": "具体反馈"},
    "reader_engagement": {"score": 数字, "feedback": "具体反馈"},
    "style_consistency": {"score": 数字, "feedback": "具体反馈"},
    "ending_quality": {"score": 数字, "feedback": "具体反馈"},
    "violations": {"score": 数字, "count": 数字, "items": ["违规项列表"]}
  },
  "highlights": ["符合风格的亮点1", "亮点2", "亮点3"],
  "improvements": ["改进建议1", "建议2"]
}

## 待审查文章

`;
}

export async function reviewStyle(articleContent: string, tone?: string): Promise<{
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
          { role: 'user', content: buildReviewPrompt(tone || 'casual') + articleContent },
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
  options: GenerateWithReviewOptions & { baseArticle?: ArticleOutput } = {}
): Promise<{ article: ArticleOutput; reviewScore: number; reviewData?: any } | null> {
  options.onThinking?.('AI 正在写作中...');

  const article = await generateArticle(project, fragments, {
    onContent: options.onContent,
    onError: options.onError,
    signal: options.signal,
    onThinking: (text) => {
      options.onThinking?.(text);
    },
    literarySubStyle: options.literarySubStyle,
    baseArticle: options.baseArticle,
  });

  if (!article) return null;

  options.onThinking?.('正在审查风格...');

  const review = await reviewStyle(article.content, project.tone);
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

/* ============================================================
   用户反馈修改 — 带修改清单输出
   ============================================================ */

const USER_FEEDBACK_REWRITE_PROMPT = `你是一位专业的中文写作者。请根据用户的修改建议，对以下文章进行针对性修改。

## 修改原则
1. 忠实执行用户的具体修改要求——这些要求是你的最高优先级指令
2. 只修改用户要求的部分，保持其他内容不变
3. 在满足用户要求的前提下，保持文章的整体风格和语气
4. 保持文章的篇幅——不要因为修改而大幅膨胀或缩水
5. 使用 Markdown 格式输出，## 标题 作为文章标题

## 用户修改要求

{USER_FEEDBACK}

## 原文

标题：{ARTICLE_TITLE}

{ARTICLE_CONTENT}

---

## 输出要求

1. 首先输出修改后的完整文章（Markdown格式，## 标题开头）
2. 在文章末尾用 --- 分隔
3. 然后用以下格式列出具体修改清单：

<!-- CHANGES
1. [修改位置] 原文 → 修改后 | 原因：用户要求XXX
2. [修改位置] 原文 → 修改后 | 原因：用户要求XXX
-->

每个修改项说明你在哪里做了什么改动以及为什么。如果用户的要求与文章无关或无法执行，在修改清单中说明。
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
    literarySubStyle?: string | null;
  } = {}
): Promise<{ article: ArticleOutput; reviewScore: number; reviewData?: any; changes?: string } | null> {
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
          { role: 'system', content: buildSystemPrompt(project, options.literarySubStyle) },
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

    // 提取修改清单
    let changesLog = '';
    const changesMatch = fullText.match(/<!-- CHANGES\n([\s\S]*?)-->/);
    if (changesMatch) {
      changesLog = changesMatch[1].trim();
    }

    // 提取文章内容（去掉修改清单注释）
    let articleText = fullText;
    const changesIdx = fullText.indexOf('<!-- CHANGES');
    if (changesIdx > 0) {
      articleText = fullText.slice(0, changesIdx).trim();
      // 去掉末尾多余的 ---
      articleText = articleText.replace(/\n---\s*$/, '');
    }

    const revisedArticle = parseArticleText(articleText, article.title);
    revisedArticle.fragmentCount = article.fragmentCount;

    options.onThinking?.('正在审查修改后的风格...');
    const review = await reviewStyle(revisedArticle.content, project.tone);
    const reviewScore = review?.score ?? 70;
    options.onReviewScore?.(reviewScore);

    revisedArticle.styleScore = reviewScore;
    if (review) {
      revisedArticle.styleBreakdown = review.breakdown;
      revisedArticle.styleHighlights = review.highlights;
      revisedArticle.styleImprovements = review.improvements;
    }

    return { article: revisedArticle, reviewScore, reviewData: review, changes: changesLog || undefined };
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
