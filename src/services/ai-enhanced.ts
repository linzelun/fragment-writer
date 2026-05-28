/**
 * AI 增强写作助手 — 纯 Prompt Engineering 实现
 * 基于现有 DeepSeek API 代理
 *
 * 功能：
 *  1. 一键生成：大纲 → 确认 → 段落生成（带上文记忆）
 *  2. 智能优化：语法纠错 + 多风格润色（中文原生风格体系）
 *  3. 引导式写作：实时关键词/结构建议（全局上下文）
 *  4. 素材分析：主题聚类、关联度、缺失角度
 *  5. AI 标签推荐：根据素材内容自动推荐标签
 */

import type { Fragment } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const PROXY_URL = `${API_BASE}/api/deepseek/v1/chat/completions`;
const MODEL = 'deepseek-chat';

/* ============================================================
   HTTP 基础请求
   ============================================================ */

async function aiCall(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    signal?: AbortSignal;
  } = {}
): Promise<string> {
  const controller = options.signal ? undefined : new AbortController();
  const timeoutId = setTimeout(
    () => (controller || new AbortController()).abort(),
    options.stream ? 180000 : 60000
  );

  try {
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
        stream: options.stream ?? false,
      }),
      signal: options.signal || controller?.signal,
    });

    if (!resp.ok) throw new Error(`请求失败 (${resp.status})`);

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

async function aiCallStream(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);
  const effectiveSignal = signal || controller.signal;
  let streamReader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  try {
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
      signal: effectiveSignal,
    });

    if (!resp.ok) throw new Error(`请求失败 (${resp.status})`);

    streamReader = resp.body?.getReader();
    if (!streamReader) throw new Error('不支持流式读取');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      if (effectiveSignal.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await streamReader.read();
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

    return fullText;
  } finally {
    clearTimeout(timeoutId);
    try { streamReader?.releaseLock(); } catch {}
  }
}

/* ============================================================
   中文原生风格体系

   设计原则：
   - 每个风格描述基于中文互联网写作的实际生态
   - 参考了当代中国写作者的实践（而非翻译英文写作指南）
   - 涵盖了从口语随笔到学术思辨的本土写作谱系
   ============================================================ */

export const STYLE_PRESETS: Record<string, { name: string; description: string; icon: string }> = {
  casual: {
    name: '口语随笔',
    description: '像写日记或给朋友写信——从生活小事引出感悟，自嘲与幽默感，汪曾祺式的平淡隽永或梁实秋式的雅致闲适',
    icon: 'coffee',
  },
  professional: {
    name: '深度长文',
    description: '开门见山的观点 + 层层递进的分析 + 扎实的案例数据——像「得到」「晚点LatePost」那样把复杂问题讲清楚',
    icon: 'briefcase',
  },
  academic: {
    name: '学术思辨',
    description: '问题意识驱动、概念辨析清晰、论证逐层推进——像「随机波动」「界面文化」那样有学理深度但不拒人千里',
    icon: 'graduation',
  },
  literary: {
    name: '文学叙事',
    description: '用细节和画面说话，情感藏在场景里——可选莫迪亚诺式的记忆碎片、沈从文式的乡土诗意、或张爱玲式的冷峻精准',
    icon: 'feather',
  },
  wechat: {
    name: '公众号推文',
    description: '短段落、金句前置、结构留白、互动钩子——符合微信公众号阅读习惯，轻松但有信息量',
    icon: 'message',
  },
  news: {
    name: '快讯速报',
    description: '信息密度高、倒金字塔结构、事实优先——适合资讯类内容，把事情说清楚就停',
    icon: 'newspaper',
  },
};

/**
 * 构建中文原生风格的系统提示词
 * 每个风格都基于中文写作的实际生态，而非翻译英文写作指南
 */
export function buildStylePrompt(style: string): string {
  const guides: Record<string, string> = {
    casual: `
【口语随笔风格 — 中文原生写作规范】

你是一位写随笔的作家，风格接近汪曾祺的平淡隽永和梁实秋的雅致闲适。

## 什么样的语气
- 像在茶馆里和老朋友聊天，娓娓道来，不紧不慢
- 可以从一件极小的事情写起——一碗面、一场雨、一个下午的走神——然后自然引出一些想法
- 允许适度的离题和跑题，但要能收回来，离题本身也是一种趣味
- 偶尔自嘲一下，但不要刻意搞笑
- 用"我"的第一人称，但不自恋——"我"只是观察世界的那个视角

## 什么样的句子
- 句子自然舒展，长短错落，像呼吸一样
- 不用感叹号，不喊口号，不灌鸡汤
- 避免"人生"、"岁月"、"灵魂"等大词——用具体的细节代替抽象的概念
- 口语化但不网络化——可以说"挺有意思的"，但别说"yyds"

## 什么样的结构
- 不是"开头-正文-结尾"的八股文
- 更像一个朋友在跟你分享他刚刚想到的一件事
- 可以以一个小细节开场，再展开，最后回到那个细节（或另一个细节）
- 结尾不是总结，而是一个画面、一个问题、或一个停顿

## 参考句式
- "说起来你可能不信……"
- "这让我想起一件小事……"
- "其实也说不上为什么……"
- "大概就是这样吧。"
`,

    professional: `
【深度长文风格 — 中文原生写作规范】

你是一位深度内容作者，风格接近「得到」的智识密度和「晚点LatePost」的分析穿透力。

## 核心原则
- 读者时间宝贵，每一段都要有信息增量
- 观点先行，再展开论证——先说结论，再说为什么
- 用数据和案例说话，避免空泛的形容词
- 把复杂问题讲清楚，而不是把简单问题讲复杂

## 结构框架
1. **钩子**（1-2段）：用一个具体场景/数据/问题抓注意力
2. **为什么重要**（1段）：这个问题为什么值得现在讨论
3. **核心分析**（主体）：逐层拆解——现象→原因→影响
4. **怎么办**（如适用）：可操作的建议或思考框架
5. **一句话收尾**：留下一个值得继续思考的命题

## 句式要求
- 段落简短（3-5句），手机屏幕友好
- 每段有一个"金句"或核心信息点——读者扫读也能抓住要点
- 适当使用"换句话说"、"更关键的是"、"值得注意的例外是"等转折标记
- 数据引用要有上下文，不是干巴巴的数字

## 避免什么
- 避免"随着……的发展"、"在……的背景下"等套话开头
- 避免"首先其次最后"的机械结构
- 避免堆砌术语——用大白话说专业的事才是真本事
- 避免结尾的"让我们一起……"或"相信未来会更好"
`,

    academic: `
【学术思辨风格 — 中文原生写作规范】

你是一位具有公共知识分子气质的思想型写作者，风格接近「随机波动」的智识温度和「界面文化」的学术公共性。

## 写作姿态
- 从一个真问题出发，而非从一个理论出发
- 概念要辨析清楚——"当我们在说XX的时候，我们到底在说什么"
- 论证有层次——不是罗列观点，而是展示思考的推进过程
- 与已有的讨论对话——"关于这个问题，通常有两种看法……但我想提出第三种角度"

## 语言特征
- 书面语为主，但不晦涩——好的学术写作应该让外行人也能看懂
- 适度使用专业概念，但每次引入都要给一个通俗的解释
- 善用"换句话说"、"更准确地说"、"值得追问的是"等思辨标记
- 句子可以稍长，但逻辑要清晰——因果、转折、递进关系要明确

## 论证结构
1. **问题的提出**：为什么这个问题值得思考
2. **概念的界定**：核心概念的内涵和外延
3. **既有观点的梳理**：别人怎么说，哪里说得不够
4. **自己的论证**：分点推进，层层深入
5. **开放的结论**：不是给出终极答案，而是打开新的问题空间

## 避免什么
- 避免学术黑话的堆砌
- 避免"众所周知"、"毋庸置疑"等跳过论证的修辞
- 避免用引用代替论证——引用是为了对话，不是为了显示博学
- 避免居高临下的说教感——你是和读者一起思考，不是替读者思考
`,

    literary: `
【文学叙事风格 — 中文原生写作规范】

你是一位文学作家。请根据用户选择的子风格进行创作。

## 子风格选择

### A. 记忆碎片（莫迪亚诺式）
- 像一个从旧照片堆里翻找记忆的人
- 时间不是线性的——从现在跳到十年前，再从十年前跳到某个更早的下午
- 物质细节是最重要的叙事锚点：一个地址簿、一张褪色的车票、雨衣上残留的气味、某年某月下午三点的光线
- 使用"我似乎记得"、"大概是"、"也许"、"我不确定"等不确定性标记
- 每段不超过4句话，句子不超过50字
- 禁止：感叹号、逻辑连接词（因为/所以）、形容词堆砌、直接情感表达、成语、结构化表达、总结性语句
- 结尾必须开放：以一个细节或一个画面结束，不要升华

### B. 乡土诗意（沈从文式）
- 像画一幅淡彩的水墨画
- 用白描手法写人写景——不评论，只呈现
- 节奏缓慢而从容，像河水静静地流
- 写人：只写他说了什么、做了什么、穿着什么，不写"他是一个善良的人"
- 写景：只用名词和动词，少用形容词——"月亮升起来了"比"皎洁的月光洒满大地"好十倍
- 对话简短，带一点方言味道，但不刻意
- 结尾像镜头慢慢拉远——人变小了，天地变大了

### C. 冷峻精准（张爱玲式）
- 像一个在角落里冷静观察一切的人
- 语言精准到残酷——每一个比喻都让人心头一颤
- 对人性的洞察藏在细节里，而非直接在议论里
- 善用通感：颜色有温度，声音有形状，气味有颜色
- 句子精炼，不浪费一个字
- 写情感时尤其克制——越激烈的感情越要轻描淡写
- 结尾往往是一个"反高潮"——在读者期待升华的时候突然降落

## 通用文学写作原则
- 展示，而非说教（Show, don't tell）
- 用具体的、可触摸的细节建立真实感
- 情感藏在动作和场景里，而非形容词里
- 留白——让读者自己去感受，不要替读者感受
- 标题可以是一个地名、一个物件的名字、一个普通却意味深长的短语
`,

    wechat: `
【公众号推文风格 — 中文原生写作规范】

你是一位熟悉微信公众号生态的编辑。你的读者是在手机上利用碎片时间阅读的人。

## 排版与节奏
- 段落极短——2-4句为一段，不超过手机屏幕的5行
- 关键句加粗或用分隔符标注，让扫读的人也能抓住重点
- 善用小标题（可带emoji），但不要每段都加——适度使用
- 段落之间空一行，制造视觉呼吸感
- 引用和案例用 > 或特殊格式突出显示

## 开头（最重要）
- 不要铺垫，直接上钩子
- 可用类型：一个令人惊讶的数据、一个具体的人物故事、一个反常识的观点、一个每个人都经历过但没人说破的场景
- 前3段必须让读者觉得"有意思，继续看"

## 正文风格
- 亲切但不油腻——你是读者的朋友，不是读者的仆人
- 信息量充足但不堆砌——每篇文章只说清楚一件事
- 适当使用"你"来建立对话感，但不要每句都"你"
- 幽默感加分，但不要刻意搞笑——自然流露最好
- 用中文互联网读者熟悉的例子和场景，不引用过于小众的梗

## 结尾
- 回到开头的钩子，形成一个闭环
- 可以设置互动引导（"你怎么看？"、"你有类似的经历吗？"），但要自然不刻意
- 可以推荐相关阅读，但不要硬塞

## 绝对禁止
- 标题党——标题要有吸引力但必须与内容相关
- 开头大段铺垫——读者在3秒内决定是否继续看
- "随着……的发展"、"在……的背景下"等套话
- 结尾的"让我们一起"、"相信未来会更好"
`,

    news: `
【快讯速报风格 — 中文原生写作规范】

你是一位专业的信息简报写作者。目标是把一件事情用最短的篇幅说清楚。

## 结构：倒金字塔
1. **标题**：一句话说清核心事实（谁做了什么事/发生了什么）
2. **导语**（1段）：5W1H——发生了什么、涉及谁、什么时候、在哪里、为什么重要
3. **主体**（2-3段）：按重要性递减排列细节，最重要的信息先出现
4. **背景**（如有需要）：提供理解此事所需的最小背景
5. **结尾**：可以没有结尾——信息说完就停

## 语言要求
- 客观、精确、克制
- 每句话传递一个信息
- 数字和日期精确到可验证
- 引用用直接引语或明确标注来源
- 不使用形容词（"重大突破"、"严重影响"），用事实替代（"增长了30%"、"影响了100万人"）
- 第三人称叙述

## 避免什么
- 避免评论和分析——快讯只负责传递事实
- 避免"据悉"、"据了解"、"有消息称"等模糊来源
- 避免渲染情绪——数据本身比感叹号更有力
`,

  };

  return guides[style] || guides.casual;
}

/**
 * 子风格选项（仅文学叙事风格使用）
 */
export const LITERARY_SUB_STYLES = [
  { key: 'modiano', name: '记忆碎片（莫迪亚诺）', description: '非线性时间、物质细节、记忆的不确定性、开放式结尾' },
  { key: 'shencongwen', name: '乡土诗意（沈从文）', description: '白描手法、从容节奏、山水意境、对话简短' },
  { key: 'zhangailing', name: '冷峻精准（张爱玲）', description: '精炼到残酷、通感比喻、克制情感、反高潮结尾' },
];

/* ============================================================
   1. 一键生成：大纲 → 段落生成（带上文记忆）
   ============================================================ */

export interface OutlineItem {
  id: string;
  title: string;
  type: 'h2' | 'h3';
  keyPoints: string[];
  sourceHints?: number[];  // 建议参考的素材序号
}

export interface OutlineResult {
  title: string;
  sections: OutlineItem[];
  estimatedWords: number;
  structureRationale?: string;  // 结构设计理由
}

/**
 * 根据主题和现有素材生成文章大纲（含素材引用标注）
 */
export async function generateOutline(
  topic: string,
  fragments: Fragment[],
  options: {
    signal?: AbortSignal;
    onError?: (msg: string) => void;
  } = {}
): Promise<OutlineResult | null> {
  const fragmentsText = fragments.length > 0
    ? fragments
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((f, i) => `### 素材 ${i + 1}\n${f.content}${f.note ? `\n[备注: ${f.note}]` : ''}`)
        .join('\n\n')
    : '（无已有素材，请基于主题自由构思）';

  const systemPrompt = `你是一位专业的文章大纲策划师。你的任务是根据用户提供的主题和素材，生成一份结构清晰、逻辑合理的文章大纲。

## 输出格式
请严格输出以下 JSON 格式（不要输出其他内容）：
{
  "title": "文章标题",
  "structureRationale": "简要说明你为什么这样设计文章结构（1-2句话）",
  "sections": [
    {
      "id": "s1",
      "title": "章节标题（H2级）",
      "type": "h2",
      "keyPoints": ["本章要点1", "要点2"],
      "sourceHints": [1, 3]
    },
    {
      "id": "s2",
      "title": "小节标题（H3级）",
      "type": "h3",
      "keyPoints": ["要点1"],
      "sourceHints": [2]
    }
  ],
  "estimatedWords": 3000
}

## 字段说明
- sourceHints: 一个数字数组，标注该章节可以参考哪些编号的素材（素材编号来自用户提供的素材列表）。没有可参考的素材则写空数组 []。
- structureRationale: 简述你这样组织文章的逻辑

## 大纲设计要求
1. 至少包含 3 个 H2 级别的主要章节
2. 每个 H2 章节可包含 1-3 个 H3 子章节
3. 逻辑递进：引言 → 主体展开 → 深度分析 → 总结展望
4. keyPoints 为每个章节的核心要点（1-3 条），不要写完整段落
5. 标题要有吸引力但不过分夸张
6. 优先利用已有素材，并在 sourceHints 中标注`;

  const userPrompt = `## 文章主题
${topic}

## 已有素材
${fragmentsText}

请根据以上信息生成文章大纲。`;

  try {
    const raw = await aiCall(systemPrompt, userPrompt, {
      temperature: 0.6,
      max_tokens: 3000,
      stream: false,
      signal: options.signal,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      options.onError?.('大纲生成格式异常，请重试');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      title: parsed.title || topic,
      structureRationale: parsed.structureRationale || '',
      sections: (parsed.sections || []).map((s: any, i: number) => ({
        id: s.id || `s${i + 1}`,
        title: s.title || `章节 ${i + 1}`,
        type: s.type || 'h2',
        keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints : [],
        sourceHints: Array.isArray(s.sourceHints) ? s.sourceHints : [],
      })),
      estimatedWords: parsed.estimatedWords || 3000,
    };
  } catch (err: any) {
    options.onError?.(err.message || '大纲生成失败');
    return null;
  }
}

/**
 * 根据确认的大纲逐段生成文章内容（流式 + 上文记忆）
 * 每个章节生成时传入已生成章节的摘要，确保连贯性
 */
export async function generateSections(
  topic: string,
  outline: OutlineResult,
  fragments: Fragment[],
  style: string,
  literarySubStyle: string | null,
  options: {
    signal?: AbortSignal;
    onSectionStart?: (sectionId: string, title: string) => void;
    onSectionChunk?: (sectionId: string, text: string) => void;
    onSectionDone?: (sectionId: string, content: string) => void;
    onAllDone?: (fullContent: string) => void;
    onError?: (msg: string) => void;
  } = {}
): Promise<string> {
  const fragmentsText = fragments.length > 0
    ? fragments
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((f, i) => `### 素材 ${i + 1}\n${f.content}`)
        .join('\n\n')
    : '（无素材）';

  // 构建风格指南
  const styleName = STYLE_PRESETS[style]?.name || style;
  const styleGuide = buildStylePrompt(style);
  let fullStyleGuide = styleGuide;

  // 如果选了文学叙事且有子风格，追加子风格指南
  if (style === 'literary' && literarySubStyle) {
    const subGuide = buildLiterarySubStylePrompt(literarySubStyle);
    fullStyleGuide = styleGuide + '\n\n## 选择的子风格\n' + subGuide;
  }

  const outlineJson = JSON.stringify({
    title: outline.title,
    structureRationale: outline.structureRationale,
    sections: outline.sections.map(s => ({
      id: s.id,
      title: s.title,
      level: s.type === 'h2' ? '二级标题' : '三级标题',
      keyPoints: s.keyPoints.join('；'),
    })),
  }, null, 2);

  let fullMarkdown = `## ${outline.title}\n\n`;
  // 记录已生成的章节内容摘要，用于传给后续章节
  const previousSummaries: string[] = [];

  for (let i = 0; i < outline.sections.length; i++) {
    const section = outline.sections[i];
    const prefix = section.type === 'h2' ? '##' : '###';

    options.onSectionStart?.(section.id, section.title);

    // 构建上文摘要
    const contextBlock = previousSummaries.length > 0
      ? `\n\n## 上文摘要（已生成的章节）\n${previousSummaries.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\n请确保本章节与上文自然衔接，避免重复上文已经写过的具体案例和表述。`
      : '';

    // 标注该章节可参考的素材
    const sourceHintsBlock = section.sourceHints && section.sourceHints.length > 0
      ? `\n## 建议参考的素材编号\n${section.sourceHints.map(n => `素材 ${n}`).join('、')}`
      : '';

    const systemPrompt = `你是一位专业写作者。请为文章的一个章节撰写内容。

## 写作风格
${fullStyleGuide}

## 本章要求
1. 仅撰写这一个章节的内容，不要写其他章节
2. 以 "${prefix} ${section.title}" 作为该章节的标题
3. 内容围绕以下要点展开：${section.keyPoints.join('、')}
4. 自然衔接上下文
5. 使用 Markdown 格式，可包含列表、引用等
6. 字数控制在 400-800 字
7. 参考建议的素材但不要直接复制粘贴——用自己的语言重新组织${contextBlock}`;

    const userPrompt = `## 文章主题
${topic}

## 完整大纲
${outlineJson}

## 可用素材
${fragmentsText}
${sourceHintsBlock}

## 当前章节
- 章节：${section.title}
- 级别：${prefix}
- 要点：${section.keyPoints.join('、')}

请只撰写这一章节的内容。`;

    try {
      const content = await aiCallStream(
        systemPrompt,
        userPrompt,
        (text) => options.onSectionChunk?.(section.id, text),
        options.signal
      );

      const trimmed = content.trim();
      fullMarkdown += trimmed + '\n\n';
      options.onSectionDone?.(section.id, trimmed);

      // 提取本章摘要（取前100字作为给下一章的上下文）
      const summary = trimmed.replace(/^#{2,4}\s+.+\n+/gm, '').trim().slice(0, 100);
      previousSummaries.push(`「${section.title}」${summary}...`);
    } catch (err: any) {
      options.onError?.(`章节"${section.title}"生成失败: ${err.message}`);
      fullMarkdown += `${prefix} ${section.title}\n\n*内容生成失败*\n\n`;
    }
  }

  options.onAllDone?.(fullMarkdown);
  return fullMarkdown;
}

function buildLiterarySubStylePrompt(subStyle: string): string {
  const guides: Record<string, string> = {
    modiano: `
【记忆碎片（莫迪亚诺式）— 写作规则】

### 必须做到
1. 每段不超过4句话。短段落制造呼吸感。
2. 每句话不超过50个字。句子自然舒展，语法完整。
3. 必须包含至少3个具体的物质细节：一个地名、一种气味、一件旧物、一束光线的角度。
4. 必须使用"记忆的不确定性"标记：每隔一段插入"我似乎记得"、"大概是"、"也许"、"我不确定"。
5. 必须有至少2处时间跳跃：从现在跳到几年前，再从几年前跳到某个更早的下午。
6. 结尾必须是开放的：不要总结，不要升华，以一个细节或一个问题结束。

### 绝对禁止
- 感叹号、因为/所以等逻辑连接词、形容词堆砌、成语俗语
- 直接情感表达（"我很伤心"）、"首先其次最后"等结构化表达
- 总结性语句（"这件事让我明白了..."）
`,

    shencongwen: `
【乡土诗意（沈从文式）— 写作规则】

### 必须做到
1. 白描手法——只写看到的、听到的、闻到的，不评论
2. 节奏从容——句子像河水的流速，不急促不拖沓
3. 写人——只写他说了什么、做了什么、穿了什么。不写"他是一个善良的人"
4. 写景——多用名词和动词。"月亮升起来了"比"皎洁的月光洒满大地"好十倍
5. 对话简短——带一点生活气息，但不刻意用方言
6. 结尾像镜头慢慢拉远——人变小了，山水变大了

### 绝对禁止
- 形容词堆砌——一个名词配一个形容词就够了
- 大段的心理描写——中国人的情感在行动里
- 道德评判——不评判人物的善恶，只呈现他们的选择
`,

    zhangailing: `
【冷峻精准（张爱玲式）— 写作规则】

### 必须做到
1. 语言精准到每一个字——可删的字统统删掉
2. 善用通感——颜色有温度，声音有形状
3. 洞察藏在细节里——不说"他们是虚伪的中产阶级"，写餐桌上的一个眼神
4. 比喻要有杀伤力——让人读完后愣住的那种
5. 写情感时尤其克制——越激烈的情感越要轻描淡写，甚至用不相干的细节来写
6. 结尾是"反高潮"——在读者期待升华的时候突然降落回日常

### 绝对禁止
- 浪漫化的描写——张爱玲不相信浪漫
- 抒情的感叹——没有"啊"和"！"
- 直白的心理描写——不写"她觉得孤独"，写"她一个人在房间里坐了很久，没有开灯"
`,
  };

  return guides[subStyle] || guides.modiano;
}

/* ============================================================
   2. 智能优化：语法纠错 + 多风格润色（保留结构）
   ============================================================ */

/**
 * 对文本进行语法纠错和风格润色
 * 核心改进：明确要求保留原文的段落结构、Markdown 标记、列表格式
 */
export async function polishText(
  text: string,
  style: string,
  options: {
    signal?: AbortSignal;
    onChunk?: (text: string) => void;
    onError?: (msg: string) => void;
  } = {}
): Promise<string | null> {
  const styleName = STYLE_PRESETS[style]?.name || style;
  const styleGuide = buildStylePrompt(style);

  const systemPrompt = `你是一位专业的文字编辑和风格润色专家。请对用户提供的文本进行优化。

## 优化层次

### 第一层：语法纠错
- 修正错别字、标点错误
- 修正语法问题
- 修正"的得地"误用

### 第二层：语句优化
- 去除冗余表达，使句子更精炼
- 改善句式，避免单调重复
- 提升表达的准确性和流畅度

### 第三层：风格适配
应用目标风格（${styleName}）的写作规范：
${styleGuide}

## 重要约束：保留原文结构

你必须严格保留原文的以下结构要素，不得做任何改动：
1. **段落划分**：原文有几个段落，润色后就几个段落——不要合并段落，也不要拆分段落
2. **Markdown 标记**：保留所有的 #标题、**加粗**、*斜体*、> 引用、- 列表、\`代码\` 等标记
3. **列表结构**：有序列表（1. 2. 3.）和无序列表（- *）的项目数量和顺序保持不变
4. **图片和链接**：保留所有图片和链接的语法
5. **空行**：保留原文的段落间空行

你只做"语句层面"的优化——在保留所有结构的前提下，让每个句子变得更好。

## 输出要求
- 输出润色后的完整文本
- 不要添加"润色后"、"优化版"等前缀说明
- 不要添加任何解释说明
- 保持原文的核心信息、观点、事实不变`;

  const userPrompt = `请将以下文本润色为【${styleName}】风格：

---
${text}
---`;

  try {
    if (options.onChunk) {
      return await aiCallStream(systemPrompt, userPrompt, options.onChunk, options.signal);
    }
    return await aiCall(systemPrompt, userPrompt, {
      temperature: 0.5,
      max_tokens: 4096,
      stream: false,
      signal: options.signal,
    });
  } catch (err: any) {
    options.onError?.(err.message || '润色失败');
    return null;
  }
}

/**
 * 仅语法纠错（不改变风格）
 */
export async function grammarCheck(
  text: string,
  options: {
    signal?: AbortSignal;
    onError?: (msg: string) => void;
  } = {}
): Promise<{ corrected: string; changes: { original: string; fixed: string; reason: string }[] } | null> {
  const systemPrompt = `你是一位严格的文字校对专家。请对文本进行语法纠错。

## 检查范围
1. 错别字、标点符号错误（中英文标点混用、引号不匹配等）
2. 语法错误（主谓不一致、句式残缺、搭配不当等）
3. "的得地"误用
4. 数字或日期格式不规范
5. 中文特有的语病（如"通过……使……"、"为了……的目的"等冗余句式）

## 输出格式
严格输出 JSON（不要输出其他内容）：
{
  "corrected": "纠错后的完整文本",
  "changes": [
    { "original": "原文错误片段", "fixed": "修正后片段", "reason": "修正原因" }
  ]
}`;

  const userPrompt = `请检查以下文本的语法错误：\n\n---\n${text}\n---`;

  try {
    const raw = await aiCall(systemPrompt, userPrompt, {
      temperature: 0.2,
      max_tokens: 4096,
      stream: false,
      signal: options.signal,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      options.onError?.('纠错结果解析失败');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      corrected: parsed.corrected || text,
      changes: Array.isArray(parsed.changes) ? parsed.changes : [],
    };
  } catch (err: any) {
    options.onError?.(err.message || '语法纠错失败');
    return null;
  }
}

/* ============================================================
   3. 引导式写作：实时建议（全局上下文）
   ============================================================ */

export interface WritingSuggestions {
  keywords: string[];
  nextSentenceHints: string[];
  structureTip: string;
  relatedAngle: string;
}

/**
 * 根据当前写作上下文提供实时建议
 * 改进：传入文章整体结构信息，让建议考虑全局而非仅局部
 */
export async function getWritingSuggestions(
  topic: string,
  currentText: string,
  articleStructure?: string,  // 可选：文章已完成部分的结构摘要
  options: {
    signal?: AbortSignal;
    onError?: (msg: string) => void;
  } = {}
): Promise<WritingSuggestions | null> {
  const context = currentText.slice(-1500);

  const structureBlock = articleStructure
    ? `\n\n## 文章已完成部分的结构\n${articleStructure}\n\n请确保你的建议与上述结构不矛盾，并考虑文章的整体走向。`
    : '';

  const systemPrompt = `你是一位经验丰富的写作教练。请根据用户正在写作的内容，提供简短精炼的写作建议。

## 输出格式（JSON）
{
  "keywords": ["3-5个建议使用的关键词或短语"],
  "nextSentenceHints": ["2-3个下一句可以写什么"],
  "structureTip": "1条关于文章结构的小建议（不超过30字）",
  "relatedAngle": "1个相关但不同的写作角度（不超过30字）"
}

## 建议原则
1. keywords: 提供与当前内容相关但尚未出现的关键词/概念，帮助扩展思路。优先提供中文语境下自然的关键词
2. nextSentenceHints: 针对最后一段/句子，给2-3个自然衔接的方向
3. structureTip: 如果发现结构可以优化（如缺少过渡、论证不够、节奏单调），给出简短建议
4. relatedAngle: 一个不同的切入角度，帮用户拓宽视野
5. 所有建议必须基于当前文本内容，不要泛泛而谈
6. 如果当前文本为空或过短（少于20字），keywords提供与主题相关的写作灵感词
7. 不要给出与上文已经写过的内容相矛盾的建议${structureBlock}`;

  const userPrompt = `## 写作主题
${topic}

## 当前正在编辑的内容
${context || '（刚开始写作，尚未输入内容）'}

请提供写作建议。`;

  try {
    const raw = await aiCall(systemPrompt, userPrompt, {
      temperature: 0.6,
      max_tokens: 1000,
      stream: false,
      signal: options.signal,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      options.onError?.('建议解析失败');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
      nextSentenceHints: Array.isArray(parsed.nextSentenceHints) ? parsed.nextSentenceHints.slice(0, 3) : [],
      structureTip: parsed.structureTip || '',
      relatedAngle: parsed.relatedAngle || '',
    };
  } catch (err: any) {
    options.onError?.(err.message || '获取写作建议失败');
    return null;
  }
}

/* ============================================================
   4. 素材智能分析：主题聚类、关联度、缺失角度
   ============================================================ */

export interface FragmentAnalysis {
  clusters: { theme: string; fragmentIds: number[]; description: string }[];
  connections: { from: number; to: number; relation: string }[];
  missingAngles: string[];
  suggestedOrder: number[];
  summary: string;
}

/**
 * 分析素材集合：主题聚类、关联网络、缺失角度、推荐展开顺序
 */
export async function analyzeFragments(
  topic: string,
  fragments: Fragment[],
  options: {
    signal?: AbortSignal;
    onError?: (msg: string) => void;
  } = {}
): Promise<FragmentAnalysis | null> {
  if (fragments.length === 0) {
    options.onError?.('暂无素材可供分析');
    return null;
  }

  const fragmentsText = fragments
    .map((f, i) => `[${i + 1}] ${f.content}${f.note ? ` (备注: ${f.note})` : ''}${f.tags.length ? ` [标签: ${f.tags.join(', ')}]` : ''}`)
    .join('\n\n');

  const systemPrompt = `你是一位写作素材分析专家。请分析用户提供的碎片素材集合。

## 分析任务

1. **主题聚类**：将素材按主题分成2-4个群组，为每个群组命名并描述
2. **关联发现**：找出素材之间的非显而易见的关联（至少2组），说明为什么它们放在一起会产生新的意义
3. **缺失角度**：指出当前素材集合中缺少的角度或观点（至少2条）——有哪些重要的面向没有被覆盖？
4. **推荐顺序**：如果要基于这些素材写一篇文章，建议的素材使用顺序（用素材编号表示）
5. **整体评价**：用2-3句话概括这组素材的特点和潜力

## 输出格式
严格输出 JSON：
{
  "clusters": [
    { "theme": "群组主题", "fragmentIds": [1, 3, 5], "description": "这个群组的特点和关联性" }
  ],
  "connections": [
    { "from": 1, "to": 4, "relation": "素材1中的观点恰好可以用素材4中的案例来佐证" }
  ],
  "missingAngles": ["缺失的角度1", "缺失的角度2"],
  "suggestedOrder": [2, 5, 1, 3, 4],
  "summary": "整体评价"
}`;

  const userPrompt = `## 文章主题
${topic}

## 素材列表（共${fragments.length}条）
${fragmentsText}

请分析以上素材。`;

  try {
    const raw = await aiCall(systemPrompt, userPrompt, {
      temperature: 0.5,
      max_tokens: 3000,
      stream: false,
      signal: options.signal,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      options.onError?.('分析结果解析失败');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      clusters: Array.isArray(parsed.clusters) ? parsed.clusters : [],
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
      missingAngles: Array.isArray(parsed.missingAngles) ? parsed.missingAngles : [],
      suggestedOrder: Array.isArray(parsed.suggestedOrder) ? parsed.suggestedOrder : [],
      summary: parsed.summary || '',
    };
  } catch (err: any) {
    options.onError?.(err.message || '素材分析失败');
    return null;
  }
}

/* ============================================================
   5. AI 标签自动推荐
   ============================================================ */

/**
 * 根据素材内容自动推荐标签
 */
export async function suggestTags(
  content: string,
  topic: string,
  existingTags: string[],
  options: {
    signal?: AbortSignal;
    onError?: (msg: string) => void;
  } = {}
): Promise<string[]> {
  const systemPrompt = `你是一位内容分类专家。请根据用户提供的文本内容，推荐3-5个标签。

## 标签要求
- 每个标签1-4个字，简洁有力
- 标签应该描述内容的类型/性质/用途，而非重复内容中的词汇
- 推荐标签类型示例：灵感、待展开、数据、引用、观点、故事、金句、问题、案例、反常识、个人经历、观察、假设、结论、行动项

## 输出格式
严格输出 JSON 字符串数组：
["标签1", "标签2", "标签3"]

不要输出其他内容。不要重复已有标签：${existingTags.join(', ') || '无'}`;

  const userPrompt = `## 写作主题
${topic}

## 文本内容
${content.slice(0, 500)}

请推荐标签。`;

  try {
    const raw = await aiCall(systemPrompt, userPrompt, {
      temperature: 0.4,
      max_tokens: 200,
      stream: false,
      signal: options.signal,
    });

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      options.onError?.('标签推荐失败');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed.filter((t: any) => typeof t === 'string' && !existingTags.includes(t)) : [];
  } catch (err: any) {
    options.onError?.(err.message || '标签推荐失败');
    return [];
  }
}
