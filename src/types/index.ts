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
