/**
 * ADHD 友好 AI 服务 — 灵感角度、微任务拆分、轻量范文脚手架
 */
import type { Fragment, InspirationResult, MicroTask, WritingProject } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const PROXY_URL = `${API_BASE}/api/deepseek/v1/chat/completions`;
const MODEL = 'deepseek-chat';

interface StreamOptions {
  onContent?: (text: string) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

const TONE_LABELS: Record<WritingProject['tone'], string> = {
  casual: '口语随笔',
  professional: '深度长文',
  academic: '学术思辨',
  storytelling: '文学叙事',
};

async function streamChat(system: string, user: string, options: StreamOptions = {}): Promise<string> {
  const { onContent, onError, signal } = options;
  let full = '';

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.75,
      max_tokens: 4096,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text();
    const msg = `AI 请求失败 (${response.status}): ${err}`;
    onError?.(msg);
    throw new Error(msg);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onContent?.(full);
        }
      } catch {
        // skip
      }
    }
  }
  return full;
}

async function jsonChat<T>(system: string, user: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.6,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI 请求失败 (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回为空');
  return JSON.parse(content) as T;
}

function formatFragments(fragments: Fragment[]): string {
  return fragments
    .map((f, i) => {
      const tags = f.tags.length ? ` [${f.tags.join(', ')}]` : '';
      const note = f.note ? `\n备注：${f.note}` : '';
      return `【碎片 ${i + 1}】${tags}\n${f.content}${note}`;
    })
    .join('\n\n');
}

function buildAdhdSystem(project?: WritingProject | null): string {
  const tone = project ? TONE_LABELS[project.tone] : '自由写作';
  const title = project?.title || '未命名项目';
  const topic = project?.topic || '';

  return `你是一位温柔、务实的中文写作搭档，专门帮助容易分心、灵感碎片化的作家。

原则：
1. 素材可以不连贯、重复、半成品——不要批评
2. 用「我发现这些碎片可以…」的口吻，不说教
3. 给具体可执行的建议，范文是脚手架不是终稿
4. 输出简洁，降低认知负担

项目：${title}
主题：${topic}
风格：${tone}`;
}

export async function generateInspiration(
  fragments: Fragment[],
  project: WritingProject | null,
  options: StreamOptions = {},
): Promise<InspirationResult> {
  const system = `${buildAdhdSystem(project)}

分析写作碎片，返回 JSON：
{
  "theme": "一句话归纳可能的主题",
  "angles": [{ "title": "不超过12字", "description": "不超过30字" }],
  "connections": "碎片间隐藏关联（2-3句）",
  "missing": "还缺什么（1-2句，语气温和）"
}
恰好 3 个 angles。`;

  const user = `共 ${fragments.length} 条碎片：\n\n${formatFragments(fragments)}`;
  return jsonChat<InspirationResult>(system, user, options.signal);
}

export async function generateScaffoldDraft(
  fragments: Fragment[],
  project: WritingProject | null,
  options: StreamOptions & { baseDraft?: string } = {},
): Promise<string> {
  const system = `${buildAdhdSystem(project)}

根据碎片写参考范文草稿：
- Markdown，以 ## 标题 开头
- 保留碎片中的独特细节
- 末尾 --- 后附「这是参考草稿，请按你的声音修改」
- 重点是帮用户动起来，不追求完美`;

  let user = `素材：\n\n${formatFragments(fragments)}`;
  if (options.baseDraft?.trim()) {
    user += `\n\n在以下草稿基础上续写：\n\n${options.baseDraft}`;
  }
  return streamChat(system, user, options);
}

export async function splitMicroTasks(
  fragments: Fragment[],
  project: WritingProject | null,
  signal?: AbortSignal,
): Promise<MicroTask[]> {
  const system = `${buildAdhdSystem(project)}

把「写一篇文章」拆成 3-4 个今天能完成的小步骤。返回 JSON：
{ "tasks": [{ "step": 1, "title": "", "description": "", "estimatedMinutes": 5 }] }
每步不超过 15 分钟，语气轻松。`;

  const user = fragments.length
    ? `当前 ${fragments.length} 条碎片：\n\n${formatFragments(fragments)}`
    : '用户还没有碎片，给出从零开始的微任务。';

  const result = await jsonChat<{ tasks: MicroTask[] }>(system, user, signal);
  return result.tasks || [];
}

export async function expandAngle(
  angle: { title: string; description: string },
  fragments: Fragment[],
  project: WritingProject | null,
  options: StreamOptions = {},
): Promise<string> {
  const system = `${buildAdhdSystem(project)}

用户选中了一个写作角度，展开成 3-5 段具体写作提示，引用碎片内容，最后给「今天写 200 字就够了」的起步建议。`;

  const user = `角度：${angle.title} — ${angle.description}\n\n碎片：\n${formatFragments(fragments)}`;
  return streamChat(system, user, options);
}
