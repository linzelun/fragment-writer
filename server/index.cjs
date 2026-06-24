const express = require('express');
const cors = require('cors');
const https = require('https');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

loadDotEnv(path.join(__dirname, '..', '.env'));

// 轻量 .env 加载：仅填充尚未存在的环境变量，避免覆盖系统/部署平台注入的值
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const PROJECT_FIELDS = ['title', 'topic', 'description', 'targetAudience', 'targetLength', 'tone'];
const FRAGMENT_FIELDS = ['content', 'source', 'note', 'tags'];

function jsonError(res, status, message) {
  res.status(status).json({ error: message });
}

function wrapRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[API] ${req.method} ${req.path}:`, err.message);
      jsonError(res, 500, '服务器内部错误');
    }
  };
}

// Migration: create article_versions table if not exists
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='article_versions'").get();
if (!tableExists) {
  db.exec(`
    CREATE TABLE article_versions (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      version INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT DEFAULT '',
      generatedAt TEXT NOT NULL,
      fragmentCount INTEGER DEFAULT 0,
      styleScore INTEGER DEFAULT NULL,
      styleBreakdown TEXT DEFAULT '{}',
      styleHighlights TEXT DEFAULT '[]',
      styleImprovements TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_article_versions_project ON article_versions(projectId, version);
  `);
  console.log('Migration: created article_versions table');
} else {
  // 检查并添加缺失的列
  const versionColumns = db.prepare("PRAGMA table_info(article_versions)").all();
  const columnNames = versionColumns.map(col => col.name);
  
  if (!columnNames.includes('styleScore')) {
    db.exec('ALTER TABLE article_versions ADD COLUMN styleScore INTEGER DEFAULT NULL');
    console.log('Migration: added styleScore column to article_versions');
  }
  if (!columnNames.includes('styleBreakdown')) {
    db.exec('ALTER TABLE article_versions ADD COLUMN styleBreakdown TEXT DEFAULT "{}"');
    console.log('Migration: added styleBreakdown column to article_versions');
  }
  if (!columnNames.includes('styleHighlights')) {
    db.exec('ALTER TABLE article_versions ADD COLUMN styleHighlights TEXT DEFAULT "[]"');
    console.log('Migration: added styleHighlights column to article_versions');
  }
  if (!columnNames.includes('styleImprovements')) {
    db.exec('ALTER TABLE article_versions ADD COLUMN styleImprovements TEXT DEFAULT "[]"');
    console.log('Migration: added styleImprovements column to article_versions');
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT DEFAULT '',
    targetAudience TEXT DEFAULT '',
    targetLength TEXT DEFAULT 'medium',
    tone TEXT DEFAULT 'casual',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fragments (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT '',
    note TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS articles (
    projectId TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT DEFAULT '',
    generatedAt TEXT NOT NULL,
    fragmentCount INTEGER DEFAULT 0,
    styleScore INTEGER DEFAULT NULL,
    styleBreakdown TEXT DEFAULT '{}',
    styleHighlights TEXT DEFAULT '[]',
    styleImprovements TEXT DEFAULT '[]'
  );
`);

// 迁移：为 fragments 表添加 source 列（如果不存在）
const fragColumns = db.prepare("PRAGMA table_info(fragments)").all().map(c => c.name);
if (!fragColumns.includes('source')) {
  db.exec("ALTER TABLE fragments ADD COLUMN source TEXT DEFAULT ''");
  console.log('[Migration] Added source column to fragments table');
}

// ========== FTS5 全文搜索支持 ==========
// 创建 FTS5 虚拟表（如果不存在）
// 注意：FTS5 表每次启动时需要检查 schema，如果表结构不匹配需要重建
const FTS_COLUMNS = ['id', 'projectId', 'content', 'source', 'note', 'tags', 'createdAt', 'updatedAt'];

function ensureFtsTable() {
  const ftsExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='fragments_fts'").get();
  
  if (ftsExists) {
    // 检查列是否匹配
    try {
      db.prepare('SELECT id, projectId, content, source, note, tags, createdAt, updatedAt FROM fragments_fts LIMIT 0').get();
      return true; // 结构匹配
    } catch (e) {
      // 结构不匹配，删除重建
      console.log('[FTS] Rebuilding FTS table (schema mismatch)...');
      db.exec('DROP TABLE IF EXISTS fragments_fts');
    }
  }
  
  db.exec(`
    CREATE VIRTUAL TABLE fragments_fts USING fts5(
      id UNINDEXED,
      projectId UNINDEXED,
      content,
      source,
      note,
      tags,
      createdAt UNINDEXED,
      updatedAt UNINDEXED
    );
  `);
  return false; // 返回 false 表示需要重建索引
}

const ftsOk = ensureFtsTable();

// 检查 FTS 索引是否需要重建
const ftsCountRow = db.prepare('SELECT COUNT(*) as cnt FROM fragments_fts').get();
const fragCountRow = db.prepare('SELECT COUNT(*) as cnt FROM fragments').get();

if (ftsCountRow.cnt === 0 && fragCountRow.cnt > 0) {
  console.log('[FTS] Rebuilding FTS index...');
  const allFragments = db.prepare('SELECT * FROM fragments').all();
  const insertFts = db.prepare('INSERT INTO fragments_fts (id, projectId, content, source, note, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const ftsTx = db.transaction((rows) => {
    for (const row of rows) {
      try { 
        insertFts.run(row.id, row.projectId, row.content, row.source || '', row.note || '', row.tags || '[]', row.createdAt, row.updatedAt); 
      } catch (e) { 
        // skip duplicates 
      }
    }
  });
  ftsTx(allFragments);
  console.log(`[FTS] Index rebuilt with ${allFragments.length} fragments`);
}

// 删除旧触发器（如果存在），然后重建
db.exec(`DROP TRIGGER IF EXISTS fragments_ai`);
db.exec(`DROP TRIGGER IF EXISTS fragments_au`);
db.exec(`DROP TRIGGER IF EXISTS fragments_ad`);

// FTS 同步触发器：当 fragments 表变更时自动更新 FTS 索引
db.exec(`
  CREATE TRIGGER IF NOT EXISTS fragments_ai AFTER INSERT ON fragments BEGIN
    INSERT INTO fragments_fts (id, projectId, content, source, note, tags, createdAt, updatedAt)
    VALUES (new.id, new.projectId, new.content, new.source, new.note, new.tags, new.createdAt, new.updatedAt);
  END;
`);
db.exec(`
  CREATE TRIGGER IF NOT EXISTS fragments_au AFTER UPDATE ON fragments BEGIN
    DELETE FROM fragments_fts WHERE id = old.id;
    INSERT INTO fragments_fts (id, projectId, content, source, note, tags, createdAt, updatedAt)
    VALUES (new.id, new.projectId, new.content, new.source, new.note, new.tags, new.createdAt, new.updatedAt);
  END;
`);
db.exec(`
  CREATE TRIGGER IF NOT EXISTS fragments_ad AFTER DELETE ON fragments BEGIN
    DELETE FROM fragments_fts WHERE id = old.id;
  END;
`);
console.log('[FTS] FTS5 search ready');

// 检查并补充 articles 表缺失的列
const articleColumns = db.prepare("PRAGMA table_info(articles)").all();
const artColumnNames = articleColumns.map(col => col.name);
if (!artColumnNames.includes('styleScore')) {
  db.exec('ALTER TABLE articles ADD COLUMN styleScore INTEGER DEFAULT NULL');
  console.log('Migration: added styleScore column to articles');
}
if (!artColumnNames.includes('styleBreakdown')) {
  db.exec('ALTER TABLE articles ADD COLUMN styleBreakdown TEXT DEFAULT "{}"');
  console.log('Migration: added styleBreakdown column to articles');
}
if (!artColumnNames.includes('styleHighlights')) {
  db.exec('ALTER TABLE articles ADD COLUMN styleHighlights TEXT DEFAULT "[]"');
  console.log('Migration: added styleHighlights column to articles');
}
if (!artColumnNames.includes('styleImprovements')) {
  db.exec('ALTER TABLE articles ADD COLUMN styleImprovements TEXT DEFAULT "[]"');
  console.log('Migration: added styleImprovements column to articles');
}

app.get('/api/projects', wrapRoute((req, res) => {
  const rows = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM fragments WHERE projectId = p.id) as fragmentCount,
      (SELECT MAX(updatedAt) FROM fragments WHERE projectId = p.id) as lastFragmentAt
    FROM projects p ORDER BY p.updatedAt DESC
  `).all();
  res.json(rows);
}));

app.post('/api/projects', wrapRoute((req, res) => {
  const { id, title, topic, description, targetAudience, targetLength, tone, createdAt, updatedAt } = req.body;
  db.prepare(
    'INSERT INTO projects (id, title, topic, description, targetAudience, targetLength, tone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, topic, description, targetAudience, targetLength, tone, createdAt, updatedAt);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(project);
}));

app.put('/api/projects/:id', wrapRoute((req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const validUpdates = {};
  for (const key of PROJECT_FIELDS) {
    if (key in updates) validUpdates[key] = updates[key];
  }

  if (Object.keys(validUpdates).length === 0) {
    return jsonError(res, 400, '没有有效的更新字段');
  }

  const fields = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(validUpdates), new Date().toISOString(), id];
  db.prepare(`UPDATE projects SET ${fields}, updatedAt = ? WHERE id = ?`).run(...values);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(project);
}));

app.delete('/api/projects/:id', wrapRoute((req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM articles WHERE projectId = ?').run(id);
  db.prepare('DELETE FROM article_versions WHERE projectId = ?').run(id);
  db.prepare('DELETE FROM fragments WHERE projectId = ?').run(id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ ok: true });
}));

app.get('/api/projects/:id/fragments', wrapRoute((req, res) => {
  const rows = db.prepare('SELECT * FROM fragments WHERE projectId = ? ORDER BY createdAt DESC').all(req.params.id);
  rows.forEach(row => { row.tags = JSON.parse(row.tags); });
  res.json(rows);
}));

app.post('/api/fragments', wrapRoute((req, res) => {
  const { id, projectId, content, source, note, tags, createdAt, updatedAt } = req.body;
  db.prepare(
    'INSERT INTO fragments (id, projectId, content, source, note, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, projectId, content, source || '', note || '', JSON.stringify(tags), createdAt, updatedAt);
  const fragment = db.prepare('SELECT * FROM fragments WHERE id = ?').get(id);
  fragment.tags = JSON.parse(fragment.tags);
  res.json(fragment);
}));

app.put('/api/fragments/:id', wrapRoute((req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const validUpdates = {};
  for (const key of FRAGMENT_FIELDS) {
    if (key in updates) validUpdates[key] = updates[key];
  }

  if (Object.keys(validUpdates).length === 0) {
    return jsonError(res, 400, '没有有效的更新字段');
  }

  if (validUpdates.tags) validUpdates.tags = JSON.stringify(validUpdates.tags);
  const fields = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(validUpdates), new Date().toISOString(), id];
  db.prepare(`UPDATE fragments SET ${fields}, updatedAt = ? WHERE id = ?`).run(...values);
  const fragment = db.prepare('SELECT * FROM fragments WHERE id = ?').get(id);
  fragment.tags = JSON.parse(fragment.tags);
  res.json(fragment);
}));

app.delete('/api/fragments/:id', wrapRoute((req, res) => {
  db.prepare('DELETE FROM fragments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}));

// ========== 全文搜索 API ==========
// GET /api/fragments/search?q=关键词&projectId=可选&limit=50
app.get('/api/fragments/search', wrapRoute((req, res) => {
  const { q, projectId, limit } = req.query;

  if (!q || !q.trim()) {
    return jsonError(res, 400, '请提供搜索关键词');
  }

  const searchQuery = q.trim();
  const resultLimit = parseInt(limit) || 50;

  // 检查 FTS 表是否存在
  const ftsTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='fragments_fts'").get();
  if (!ftsTableExists) {
    return fallbackSearch(res, searchQuery, projectId, resultLimit);
  }
  
  try {
    let sql, params;
    
    if (projectId) {
      sql = `
        SELECT f.*,
               snippet(fragments_fts, 2, '<mark>', '</mark>', '...', 40) as highlightContent,
               snippet(fragments_fts, 3, '<mark>', '</mark>', '...', 40) as highlightSource,
               snippet(fragments_fts, 4, '<mark>', '</mark>', '...', 40) as highlightNote,
               snippet(fragments_fts, 5, '<mark>', '</mark>', '...', 40) as highlightTags,
               bm25(fragments_fts) as rank
        FROM fragments_fts
        JOIN fragments f ON f.id = fragments_fts.id
        WHERE fragments_fts MATCH ? AND f.projectId = ?        ORDER BY rank
        LIMIT ?
      `;
      params = [escapeFtsQuery(searchQuery), projectId, resultLimit];
    } else {
      sql = `
        SELECT f.*,
               snippet(fragments_fts, 2, '<mark>', '</mark>', '...', 40) as highlightContent,
               snippet(fragments_fts, 3, '<mark>', '</mark>', '...', 40) as highlightSource,
               snippet(fragments_fts, 4, '<mark>', '</mark>', '...', 40) as highlightNote,
               snippet(fragments_fts, 5, '<mark>', '</mark>', '...', 40) as highlightTags,
               bm25(fragments_fts) as rank
        FROM fragments_fts
        JOIN fragments f ON f.id = fragments_fts.id
        WHERE fragments_fts MATCH ?        ORDER BY rank
        LIMIT ?
      `;
      params = [escapeFtsQuery(searchQuery), resultLimit];
    }
    
    const rows = db.prepare(sql).all(...params);
    
    // 解析 tags JSON
    rows.forEach(row => {
      try { row.tags = JSON.parse(row.tags || '[]'); } catch { row.tags = []; }
      // 清理 FTS 内部字段
      delete row.rank;
    });
    
    res.json({
      query: searchQuery,
      total: rows.length,
      results: rows,
    });
  } catch (err) {
    console.warn('[FTS] FTS query failed, falling back to LIKE:', err.message);
    return fallbackSearch(res, searchQuery, projectId, resultLimit);
  }
}));

// 转义 FTS5 查询中的特殊字符，防止语法错误
function escapeFtsQuery(query) {
  return query
    .replace(/['"]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(t => t.length > 0)
    .map(t => `"${t}"`)
    .join(' OR ');
}

// LIKE 回退搜索
function fallbackSearch(res, query, projectId, limit) {
  const likePattern = `%${query}%`;
  let sql, params;

  if (projectId) {
    sql = `
      SELECT * FROM fragments
      WHERE projectId = ?
        AND (content LIKE ? OR source LIKE ? OR note LIKE ? OR tags LIKE ?)
      ORDER BY updatedAt DESC
      LIMIT ?
    `;
    params = [projectId, likePattern, likePattern, likePattern, likePattern, limit];
  } else {
    sql = `
      SELECT * FROM fragments
      WHERE content LIKE ? OR source LIKE ? OR note LIKE ? OR tags LIKE ?
      ORDER BY updatedAt DESC
      LIMIT ?
    `;
    params = [likePattern, likePattern, likePattern, likePattern, limit];
  }

  const rows = db.prepare(sql).all(...params);
  rows.forEach(row => {
    try { row.tags = JSON.parse(row.tags || '[]'); } catch { row.tags = []; }
  });
  
  res.json({
    query,
    total: rows.length,
    results: rows,
    fallback: true,
  });
}

app.get('/api/articles/:projectId', wrapRoute((req, res) => {
  const articleRow = db.prepare('SELECT * FROM articles WHERE projectId = ?').get(req.params.projectId);
  if (articleRow) {
    articleRow.styleScore = articleRow.styleScore !== null ? articleRow.styleScore : undefined;
    articleRow.styleBreakdown = articleRow.styleBreakdown ? JSON.parse(articleRow.styleBreakdown) : undefined;
    articleRow.styleHighlights = articleRow.styleHighlights ? JSON.parse(articleRow.styleHighlights) : undefined;
    articleRow.styleImprovements = articleRow.styleImprovements ? JSON.parse(articleRow.styleImprovements) : undefined;
  }
  res.json(articleRow || null);
}));

app.post('/api/articles', wrapRoute((req, res) => {
  const { projectId, title, content, summary, generatedAt, fragmentCount, styleScore, styleBreakdown, styleHighlights, styleImprovements } = req.body;

  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='article_versions'").get();
  if (!tableExists) {
    db.exec(`
      CREATE TABLE article_versions (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        version INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT DEFAULT '',
        generatedAt TEXT NOT NULL,
        fragmentCount INTEGER DEFAULT 0,
        styleScore INTEGER DEFAULT NULL,
        styleBreakdown TEXT DEFAULT '{}',
        styleHighlights TEXT DEFAULT '[]',
        styleImprovements TEXT DEFAULT '[]',
        createdAt TEXT NOT NULL
      );
      CREATE INDEX idx_article_versions_project ON article_versions(projectId, version);
    `);
  }

  db.prepare(
    'INSERT OR REPLACE INTO articles (projectId, title, content, summary, generatedAt, fragmentCount, styleScore, styleBreakdown, styleHighlights, styleImprovements) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(projectId, title, content, summary, generatedAt, fragmentCount,
        styleScore || null,
        styleBreakdown ? JSON.stringify(styleBreakdown) : '{}',
        styleHighlights ? JSON.stringify(styleHighlights) : '[]',
        styleImprovements ? JSON.stringify(styleImprovements) : '[]');

  const versionResult = db.prepare('SELECT MAX(version) as maxVersion FROM article_versions WHERE projectId = ?').get(projectId);
  const nextVersion = (versionResult?.maxVersion || 0) + 1;

  const versionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO article_versions (id, projectId, version, title, content, summary, generatedAt, fragmentCount, styleScore, styleBreakdown, styleHighlights, styleImprovements, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(versionId, projectId, nextVersion, title, content, summary, generatedAt, fragmentCount,
        styleScore || null,
        styleBreakdown ? JSON.stringify(styleBreakdown) : '{}',
        styleHighlights ? JSON.stringify(styleHighlights) : '[]',
        styleImprovements ? JSON.stringify(styleImprovements) : '[]',
        now);

  console.log(`[API] Saved article version ${nextVersion} for project ${projectId}`);

  db.prepare(
    'DELETE FROM article_versions WHERE projectId = ? AND id NOT IN (SELECT id FROM article_versions WHERE projectId = ? ORDER BY version DESC LIMIT 10)'
  ).run(projectId, projectId);

  const articleRow = db.prepare('SELECT * FROM articles WHERE projectId = ?').get(projectId);
  if (articleRow) {
    articleRow.styleScore = articleRow.styleScore !== null ? articleRow.styleScore : undefined;
    articleRow.styleBreakdown = articleRow.styleBreakdown ? JSON.parse(articleRow.styleBreakdown) : undefined;
    articleRow.styleHighlights = articleRow.styleHighlights ? JSON.parse(articleRow.styleHighlights) : undefined;
    articleRow.styleImprovements = articleRow.styleImprovements ? JSON.parse(articleRow.styleImprovements) : undefined;
  }
  res.json(articleRow);
}));

app.get('/api/articles/:projectId/versions', wrapRoute((req, res) => {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='article_versions'").get();
  if (!tableExists) {
    db.exec(`
      CREATE TABLE article_versions (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        version INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT DEFAULT '',
        generatedAt TEXT NOT NULL,
        fragmentCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX idx_article_versions_project ON article_versions(projectId, version);
    `);
  }
  const rows = db.prepare('SELECT id, version, title, summary, generatedAt, fragmentCount, createdAt FROM article_versions WHERE projectId = ? ORDER BY version DESC').all(req.params.projectId);
  console.log(`[API] Get versions for project ${req.params.projectId}:`, rows.length, 'versions');
  res.json(rows);
}));

app.get('/api/articles/:projectId/versions/:versionId', wrapRoute((req, res) => {
  const articleRow = db.prepare('SELECT * FROM article_versions WHERE projectId = ? AND id = ?').get(req.params.projectId, req.params.versionId);
  if (!articleRow) {
    return jsonError(res, 404, '版本不存在');
  }
  if (articleRow) {
    articleRow.styleScore = articleRow.styleScore !== null ? articleRow.styleScore : undefined;
    articleRow.styleBreakdown = articleRow.styleBreakdown ? JSON.parse(articleRow.styleBreakdown) : undefined;
    articleRow.styleHighlights = articleRow.styleHighlights ? JSON.parse(articleRow.styleHighlights) : undefined;
    articleRow.styleImprovements = articleRow.styleImprovements ? JSON.parse(articleRow.styleImprovements) : undefined;
  }
  res.json(articleRow);
}));

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeFragmentRow(row) {
  return {
    ...row,
    tags: parseJsonField(row.tags, []),
  };
}

function normalizeArticleRow(row) {
  return {
    ...row,
    styleScore: row.styleScore !== null ? row.styleScore : undefined,
    styleBreakdown: parseJsonField(row.styleBreakdown, undefined),
    styleHighlights: parseJsonField(row.styleHighlights, undefined),
    styleImprovements: parseJsonField(row.styleImprovements, undefined),
  };
}

app.get('/api/backup', wrapRoute((req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all();
  const fragments = db.prepare('SELECT * FROM fragments ORDER BY createdAt ASC').all().map(normalizeFragmentRow);
  const articles = db.prepare('SELECT * FROM articles').all().map(normalizeArticleRow);
  const articleVersions = db.prepare('SELECT * FROM article_versions ORDER BY projectId ASC, version ASC').all().map(normalizeArticleRow);

  res.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    projects,
    fragments,
    articles,
    articleVersions,
  });
}));

app.post('/api/backup', wrapRoute((req, res) => {
  const { mode = 'replace', data } = req.body || {};
  if (!data || data.version !== 1) return jsonError(res, 400, '备份文件格式不正确');

  const projects = Array.isArray(data.projects) ? data.projects : [];
  const fragments = Array.isArray(data.fragments) ? data.fragments : [];
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const articleVersions = Array.isArray(data.articleVersions) ? data.articleVersions : [];

  const tx = db.transaction(() => {
    if (mode === 'replace') {
      db.prepare('DELETE FROM article_versions').run();
      db.prepare('DELETE FROM articles').run();
      db.prepare('DELETE FROM fragments').run();
      db.prepare('DELETE FROM projects').run();
    }

    const upsertProject = db.prepare(`
      INSERT OR REPLACE INTO projects (id, title, topic, description, targetAudience, targetLength, tone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of projects) {
      if (!p.id || !p.title || !p.topic) continue;
      upsertProject.run(
        p.id,
        p.title,
        p.topic,
        p.description || '',
        p.targetAudience || '',
        p.targetLength || 'medium',
        p.tone || 'casual',
        p.createdAt || new Date().toISOString(),
        p.updatedAt || p.createdAt || new Date().toISOString()
      );
    }

    const upsertFragment = db.prepare(`
      INSERT OR REPLACE INTO fragments (id, projectId, content, source, note, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const f of fragments) {
      if (!f.id || !f.projectId || !f.content) continue;
      upsertFragment.run(
        f.id,
        f.projectId,
        f.content,
        f.source || '',
        f.note || '',
        JSON.stringify(Array.isArray(f.tags) ? f.tags : []),
        f.createdAt || new Date().toISOString(),
        f.updatedAt || f.createdAt || new Date().toISOString()
      );
    }

    const upsertArticle = db.prepare(`
      INSERT OR REPLACE INTO articles (projectId, title, content, summary, generatedAt, fragmentCount, styleScore, styleBreakdown, styleHighlights, styleImprovements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of articles) {
      if (!a.projectId || !a.title || !a.content) continue;
      upsertArticle.run(
        a.projectId,
        a.title,
        a.content,
        a.summary || '',
        a.generatedAt || new Date().toISOString(),
        a.fragmentCount || 0,
        a.styleScore ?? null,
        JSON.stringify(a.styleBreakdown || {}),
        JSON.stringify(a.styleHighlights || []),
        JSON.stringify(a.styleImprovements || [])
      );
    }

    const upsertVersion = db.prepare(`
      INSERT OR REPLACE INTO article_versions (id, projectId, version, title, content, summary, generatedAt, fragmentCount, styleScore, styleBreakdown, styleHighlights, styleImprovements, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const v of articleVersions) {
      if (!v.id || !v.projectId || !v.title || !v.content) continue;
      upsertVersion.run(
        v.id,
        v.projectId,
        v.version || 1,
        v.title,
        v.content,
        v.summary || '',
        v.generatedAt || new Date().toISOString(),
        v.fragmentCount || 0,
        v.styleScore ?? null,
        JSON.stringify(v.styleBreakdown || {}),
        JSON.stringify(v.styleHighlights || []),
        JSON.stringify(v.styleImprovements || []),
        v.createdAt || new Date().toISOString()
      );
    }
  });

  tx();
  res.json({
    ok: true,
    projects: projects.length,
    fragments: fragments.length,
    articles: articles.length,
    articleVersions: articleVersions.length,
  });
}));

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'api.deepseek.com';

if (!DEEPSEEK_API_KEY) {
  console.error('[启动失败] 缺少环境变量 DEEPSEEK_API_KEY。请在 .env 中配置，或在启动前导出该变量。');
  process.exit(1);
}

app.post('/api/deepseek/v1/chat/completions', (req, res) => {
  const options = {
    hostname: DEEPSEEK_BASE,
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'AI 服务暂时不可用，请稍后重试' }));
  });

  proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
