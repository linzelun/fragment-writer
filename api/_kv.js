import { kv } from '@vercel/kv';

const PROJECTS_KEY = 'projects';
const fragmentsKey = (projectId) => `fragments:${projectId}`;
const articleKey = (projectId) => `article:${projectId}`;
const versionsKey = (projectId) => `versions:${projectId}`;

export function json(res, data, status = 200) {
  res.status(status).json(data);
}

export function error(res, message, status = 400) {
  res.status(status).json({ error: message });
}

// Projects
export async function getProjects() {
  return (await kv.get(PROJECTS_KEY)) || [];
}

export async function saveProjects(projects) {
  await kv.set(PROJECTS_KEY, projects);
}

export async function getProject(id) {
  const projects = await getProjects();
  return projects.find(p => p.id === id) || null;
}

// Fragments
export async function getFragments(projectId) {
  return (await kv.get(fragmentsKey(projectId))) || [];
}

export async function saveFragments(projectId, fragments) {
  await kv.set(fragmentsKey(projectId), fragments);
}

// Articles
export async function getArticle(projectId) {
  return (await kv.get(articleKey(projectId))) || null;
}

export async function saveArticle(projectId, article) {
  await kv.set(articleKey(projectId), article);
}

// Versions
export async function getVersions(projectId) {
  return (await kv.get(versionsKey(projectId))) || [];
}

export async function saveVersions(projectId, versions) {
  await kv.set(versionsKey(projectId), versions);
}