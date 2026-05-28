/**
 * AI 增强写作助手 — 纯 Prompt Engineering 实现
 * 基于现有 DeepSeek API 代理，不引入新依赖
 *
 * 功能：
 *  1. 一键生成：大纲 → 确认 → 段落生成
 *  2. 智能优化：语法纠错 + 多风格切换
 *  3. 引导式写作：实时关键词/结构建议
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
   风格定义
   ============================================================ */

export const STYLE_PRESETS: Record<string, { name: string; description: string; icon: string }> = {
  academic: {
    name: '学术',
    description: '严谨客观、逻辑严密、文献引用风格',
    icon: 'graduation',
  },
  business: {
    name: '商务',
    description: '专业高效、清晰简洁、行动导向',
    icon: 'briefcase',
  },
  literary: {
    name: '文艺',
    description: '诗意文字、感官描写、情感细腻',
    icon: 'feather',
  },
  wechat: {
    name: '公众号',
    description: '轻松易读、排版友好、互动感强',
    icon: 'message',
  },
  news: {
    name: '新闻',
    description: '客观精炼、倒金字塔、事实优先',
    icon: 'newspaper',
  },
  casual: {
    name: '口语',
    description: '自然流畅、生活化表达、亲近感',
    icon: 'coffee',
  },
};

function buildStylePrompt(style: string): string {
  const guides: Record<string, string> = {
    academic: `
【学术风格要求】
- 使用正式、严谨的书面语言
- 段落结构清晰：论点 → 论据 → 小结
- 多用"研究表明"、"数据表明"、"值得关注的是"等学术表达
- 避免口语化、避免主观臆断性词汇
- 适当使用专业术语，但需确保非专业人士也能理解
- 保持客观中立，不使用"我认为"等主观表达
`,

    business: `
【商务风格要求】
- 语言精炼高效，直奔主题
- 使用主动语态和动词驱动句式
- 段落简洁，信息密度高
- 适当使用"关键要点"、"核心优势"、"下一步行动"等商务框架
- 避免模糊表达，用数据和事实说话
- 语气自信但不傲慢
`,

    literary: `
【文艺风格要求】
- 使用诗意的、富有画面感的语言
- 注重感官细节描写（视觉、听觉、嗅觉、触觉）
- 句子节奏富于变化，长短交错
- 善用比喻和意象，但不堆砌
- 情感表达细腻，展示而非说教
- 段落之间保持意脉相连
`,

    wechat: `
【公众号风格要求】
- 语言轻松易读，段落简短（手机屏幕友好）
- 使用短句，适当分行，增强留白
- 开头用钩子抓住注意力（设问/金句/场景）
- 关键信息用加粗、分段来建立视觉层次
- 结尾设置互动引导（"你怎么看？"、"欢迎分享"）
- 保持亲切但不油腻的语调
`,

    news: `
【新闻风格要求】
- 倒金字塔结构：最重要信息在前
- 语言客观、精炼、准确
- 使用第三人称叙述
- 时间、地点、人物、事件要素清晰
- 避免形容词堆砌，用事实和引语支撑
- 段落简短，每段传递一个核心信息
`,

    casual: `
【口语风格要求】
- 自然流畅，像朋友聊天一样亲切
- 可以使用"你"来拉近距离
- 句型灵活，不必过于规范
- 适当使用生活化的比喻和例子
- 避免过于书面化、避免过多修饰语
- 表达真诚自然，不刻意煽情
`,
  };

  return guides[style] || guides.casual;
}

/* ============================================================
   1. 一键生成：大纲 → 段落生成
   ============================================================ */

/** 大纲结构 */
export interface OutlineItem {
  id: string;
  title: string;
  type: 'h2' | 'h3';
  keyPoints: string[];
}

export interface OutlineResult {
  title: string;
  sections: OutlineItem[];
  estimatedWords: number;
}

/**
 * 根据主题和现有素材生成文章大纲
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
        .map((f, i) => `### 素材 ${i + 1}\n${f.content}`)
        .join('\n\n')
    : '（无已有素材，请基于主题自由构思）';

  const systemPrompt = `你是一位专业的文章大纲策划师。你的任务是根据用户提供的主题和素材，生成一份结构清晰、逻辑合理的文章大纲。

## 输出格式
请严格输出以下 JSON 格式（不要输出其他内容）：
{
  "title": "文章标题",
  "sections": [
    { "id": "s1", "title": "章节标题（H2级）", "type": "h2", "keyPoints": ["要点1", "要点2"] },
    { "id": "s2", "title": "小节标题（H3级）", "type": "h3", "keyPoints": ["要点1"] }
  ],
  "estimatedWords": 3000
}

## 大纲设计要求
1. 至少包含 3 个 H2 级别的主要章节
2. 每个 H2 章节可包含 1-3 个 H3 子章节
3. 逻辑递进：引言 → 主体展开 → 深度分析 → 总结展望
4. keyPoints 为每个章节的核心要点（1-3 条），不要写完整段落
5. 标题要有吸引力但不过分夸张
6. 如果能从素材中提取到可用信息，优先融入大纲`;

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

    // 规范化输出
    return {
      title: parsed.title || topic,
      sections: (parsed.sections || []).map((s: any, i: number) => ({
        id: s.id || `s${i + 1}`,
        title: s.title || `章节 ${i + 1}`,
        type: s.type || 'h2',
        keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints : [],
      })),
      estimatedWords: parsed.estimatedWords || 3000,
    };
  } catch (err: any) {
    options.onError?.(err.message || '大纲生成失败');
    return null;
  }
}

/**
 * 根据确认的大纲逐段生成文章内容（流式）
 */
export async function generateSections(
  topic: string,
  outline: OutlineResult,
  fragments: Fragment[],
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

  const outlineJson = JSON.stringify({
    title: outline.title,
    sections: outline.sections.map(s => ({
      id: s.id,
      title: s.title,
      level: s.type === 'h2' ? '二级标题' : '三级标题',
      keyPoints: s.keyPoints.join('；'),
    })),
  }, null, 2);

  let fullMarkdown = `## ${outline.title}\n\n`;

  for (let i = 0; i < outline.sections.length; i++) {
    const section = outline.sections[i];
    const prefix = section.type === 'h2' ? '##' : '###';

    options.onSectionStart?.(section.id, section.title);

    const systemPrompt = `你是一位专业写作者。请为文章的一个章节撰写内容。

## 要求
1. 仅撰写这一个章节的内容，不要写其他章节
2. 以 "${prefix} ${section.title}" 作为该章节的标题
3. 内容围绕以下要点展开：${section.keyPoints.join('、')}
4. 自然衔接上下文，但无需写"上一节我们讨论了"等过渡句
5. 使用 Markdown 格式，可包含列表、引用等
6. 字数控制在 400-800 字`;

    const userPrompt = `## 文章主题
${topic}

## 完整大纲
${outlineJson}

## 可用素材
${fragmentsText}

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

      fullMarkdown += content.trim() + '\n\n';
      options.onSectionDone?.(section.id, content.trim());
    } catch (err: any) {
      options.onError?.(`章节"${section.title}"生成失败: ${err.message}`);
      fullMarkdown += `${prefix} ${section.title}\n\n*内容生成失败*\n\n`;
    }
  }

  options.onAllDone?.(fullMarkdown);
  return fullMarkdown;
}

/* ============================================================
   2. 智能优化：语法纠错 + 多风格润色
   ============================================================ */

/**
 * 对文本进行语法纠错和风格润色
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

  const systemPrompt = `你是一位专业的文字编辑和风格润色专家。请对用户提供的文本进行三层次优化：

## 层次一：语法纠错
- 修正错别字、标点错误
- 修正语法问题（主谓一致、句式残缺等）
- 修正数字、日期等格式问题

## 层次二：语句优化
- 去除冗余表达，使句子更精炼
- 改善句式，避免单调重复
- 提升表达的准确性和流畅度

## 层次三：风格适配
应用目标风格（${styleName}）的写作规范：
${styleGuide}

## 输出要求
- 输出润色后的完整文本，不要添加"润色后"、"优化版"等前缀说明
- 保持原文的核心信息和观点不变
- 如果原文正确且风格已符合要求，输出原文即可
- 仅输出润色后的文本，不要添加任何解释说明`;

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
1. 错别字
2. 标点符号错误（中英文标点混用、引号不匹配等）
3. 语法错误（主谓不一致、句式残缺、搭配不当等）
4. "的得地"误用
5. 数字或日期格式不规范

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
   3. 引导式写作：实时建议
   ============================================================ */

export interface WritingSuggestions {
  keywords: string[];
  nextSentenceHints: string[];
  structureTip: string;
  relatedAngle: string;
}

/**
 * 根据当前写作上下文提供实时建议
 * @param topic 文章主题
 * @param currentText 用户当前编辑的文本
 * @param cursorPosition 光标所在段落（可选，用于更精准的建议）
 */
export async function getWritingSuggestions(
  topic: string,
  currentText: string,
  options: {
    signal?: AbortSignal;
    onError?: (msg: string) => void;
  } = {}
): Promise<WritingSuggestions | null> {
  // 截取最近的 1500 字作为上下文
  const context = currentText.slice(-1500);

  const systemPrompt = '你是一位经验丰富的写作教练。请根据用户正在写作的内容，提供简短精炼的写作建议。\n\n## 输出格式（JSON）\n{\n  "keywords": ["3-5个建议使用的关键词或短语"],\n  "nextSentenceHints": ["2-3个下一句可以写什么"],\n  "structureTip": "1条关于文章结构的小建议（不超过30字）",\n  "relatedAngle": "1个相关但不同的写作角度（不超过30字）"\n}\n\n## 建议原则\n1. keywords: 提供与当前内容相关但尚未出现的关键词/概念，帮助扩展思路\n2. nextSentenceHints: 针对最后一段/句子，给 2-3 个自然衔接的方向\n3. structureTip: 如果发现结构可以优化（如缺少过渡、论证不够），给出简短建议\n4. relatedAngle: 一个不同的切入角度，帮用户拓宽视野\n5. 所有建议必须基于当前文本内容，不要泛泛而谈\n6. 如果当前文本为空或过短（少于20字），keywords 提供与主题相关的写作灵感词';

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