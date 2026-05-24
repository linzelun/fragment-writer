const express = require('express');
const cors = require('cors');
const https = require('https');
const Database = require('better-sqlite3');
const path = require('path');

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
    fragmentCount INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS article_versions (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT DEFAULT '',
    generatedAt TEXT NOT NULL,
    fragmentCount INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_article_versions_project ON article_versions(projectId, version);
`);

app.get('/api/projects', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all();
  res.json(rows);
});

app.post('/api/projects', (req, res) => {
  const { id, title, topic, description, targetAudience, targetLength, tone, createdAt, updatedAt } = req.body;
  db.prepare(
    'INSERT INTO projects (id, title, topic, description, targetAudience, targetLength, tone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, topic, description, targetAudience, targetLength, tone, createdAt, updatedAt);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(project);
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), new Date().toISOString(), id];
  db.prepare(`UPDATE projects SET ${fields}, updatedAt = ? WHERE id = ?`).run(...values);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM articles WHERE projectId = ?').run(id);
  db.prepare('DELETE FROM fragments WHERE projectId = ?').run(id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.get('/api/projects/:id/fragments', (req, res) => {
  const rows = db.prepare('SELECT * FROM fragments WHERE projectId = ? ORDER BY createdAt DESC').all(req.params.id);
  rows.forEach(row => { row.tags = JSON.parse(row.tags); });
  res.json(rows);
});

app.post('/api/fragments', (req, res) => {
  const { id, projectId, content, note, tags, createdAt, updatedAt } = req.body;
  db.prepare(
    'INSERT INTO fragments (id, projectId, content, note, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, projectId, content, note, JSON.stringify(tags), createdAt, updatedAt);
  const fragment = db.prepare('SELECT * FROM fragments WHERE id = ?').get(id);
  fragment.tags = JSON.parse(fragment.tags);
  res.json(fragment);
});

app.put('/api/fragments/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (updates.tags) updates.tags = JSON.stringify(updates.tags);
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), new Date().toISOString(), id];
  db.prepare(`UPDATE fragments SET ${fields}, updatedAt = ? WHERE id = ?`).run(...values);
  const fragment = db.prepare('SELECT * FROM fragments WHERE id = ?').get(id);
  fragment.tags = JSON.parse(fragment.tags);
  res.json(fragment);
});

app.delete('/api/fragments/:id', (req, res) => {
  db.prepare('DELETE FROM fragments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/articles/:projectId', (req, res) => {
  const article = db.prepare('SELECT * FROM articles WHERE projectId = ?').get(req.params.projectId);
  res.json(article || null);
});

app.post('/api/articles', (req, res) => {
  const { projectId, title, content, summary, generatedAt, fragmentCount } = req.body;
  
  // Save to current article
  db.prepare(
    'INSERT OR REPLACE INTO articles (projectId, title, content, summary, generatedAt, fragmentCount) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(projectId, title, content, summary, generatedAt, fragmentCount);
  
  // Get next version number
  const versionResult = db.prepare('SELECT MAX(version) as maxVersion FROM article_versions WHERE projectId = ?').get(projectId);
  const nextVersion = (versionResult?.maxVersion || 0) + 1;
  
  // Save version history
  const versionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO article_versions (id, projectId, version, title, content, summary, generatedAt, fragmentCount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(versionId, projectId, nextVersion, title, content, summary, generatedAt, fragmentCount, now);
  
  // Keep only last 10 versions
  db.prepare(
    'DELETE FROM article_versions WHERE projectId = ? AND id NOT IN (SELECT id FROM article_versions WHERE projectId = ? ORDER BY version DESC LIMIT 10)'
  ).run(projectId, projectId);
  
  const article = db.prepare('SELECT * FROM articles WHERE projectId = ?').get(projectId);
  res.json(article);
});

app.get('/api/articles/:projectId/versions', (req, res) => {
  const rows = db.prepare('SELECT id, version, title, summary, generatedAt, fragmentCount, createdAt FROM article_versions WHERE projectId = ? ORDER BY version DESC').all(req.params.projectId);
  res.json(rows);
});

app.get('/api/articles/:projectId/versions/:versionId', (req, res) => {
  const article = db.prepare('SELECT * FROM article_versions WHERE projectId = ? AND id = ?').get(req.params.projectId, req.params.versionId);
  if (!article) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }
  res.json(article);
});

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-1309f0b2ab6342619d4bdf4fe4c22e28';
const DEEPSEEK_BASE = 'api.deepseek.com';

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
