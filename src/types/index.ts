export interface Fragment {
  id: string;
  projectId: string;
  content: string;
  source?: string;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult extends Fragment {
  highlightContent?: string;
  highlightSource?: string;
  highlightNote?: string;
  highlightTags?: string;
}

export interface WritingProject {
  id: string;
  title: string;
  topic: string;
  description: string;
  targetAudience: string;
  targetLength: 'short' | 'medium' | 'long';
  tone: 'casual' | 'professional' | 'academic' | 'storytelling';
  createdAt: string;
  updatedAt: string;
  fragmentCount?: number;
  lastFragmentAt?: string;
}

export interface ArticleOutput {
  title: string;
  content: string;
  summary: string;
  generatedAt: string;
  fragmentCount: number;
  styleScore?: number; // 莫迪亚诺风格评分 (0-100)
  styleBreakdown?: Record<string, { score: number; feedback: string }>; // 评分明细
  styleHighlights?: string[];
  styleImprovements?: string[];
}

export interface ArticleVersion {
  id: string;
  projectId: string;
  version: number;
  title: string;
  summary: string;
  generatedAt: string;
  fragmentCount: number;
  createdAt: string;
}

export interface AIStreamChunk {
  type: 'thinking' | 'content' | 'done' | 'error';
  text?: string;
  article?: ArticleOutput;
  error?: string;
}

export interface ExportFormat {
  type: 'markdown' | 'plaintext' | 'html';
  label: string;
  mimeType: string;
  extension: string;
}

/* --- ADHD 写作搭档 --- */

export interface InspirationResult {
  theme: string;
  angles: { title: string; description: string }[];
  connections: string;
  missing: string;
}

export interface MicroTask {
  step: number;
  title: string;
  description: string;
  estimatedMinutes: number;
}

export type FocusTaskType = 'capture' | 'inspire' | 'draft' | 'custom';

export interface FocusSession {
  taskType: FocusTaskType;
  taskLabel: string;
  durationMinutes: number;
}

export interface LocalStats {
  lastCaptureDate: string | null;
  streakDays: number;
  totalCaptures: number;
  aiUsageCount: number;
}
