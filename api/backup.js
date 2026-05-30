import {
  deleteProjectData,
  error,
  getArticle,
  getFragments,
  getProjects,
  getVersions,
  json,
  saveArticle,
  saveFragments,
  saveProjects,
  saveVersions,
} from './_kv.js';

function isBackupData(data) {
  return (
    data &&
    data.version === 1 &&
    Array.isArray(data.projects) &&
    Array.isArray(data.fragments) &&
    Array.isArray(data.articles) &&
    Array.isArray(data.articleVersions)
  );
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const projects = await getProjects();
      const fragmentGroups = await Promise.all(projects.map((p) => getFragments(p.id)));
      const articleRows = await Promise.all(
        projects.map(async (p) => {
          const article = await getArticle(p.id);
          return article ? { ...article, projectId: p.id } : null;
        })
      );
      const versionGroups = await Promise.all(projects.map((p) => getVersions(p.id)));

      return json(res, {
        version: 1,
        exportedAt: new Date().toISOString(),
        projects,
        fragments: fragmentGroups.flat(),
        articles: articleRows.filter(Boolean),
        articleVersions: versionGroups.flat(),
      });
    }

    if (req.method === 'POST') {
      const { mode = 'replace', data } = req.body || {};
      if (!isBackupData(data)) return error(res, '备份文件格式不正确', 400);

      const previousProjects = await getProjects();
      if (mode === 'replace') {
        await Promise.all(previousProjects.map((p) => deleteProjectData(p.id)));
      }

      await saveProjects(data.projects);

      const fragmentsByProject = new Map();
      for (const fragment of data.fragments) {
        if (!fragment?.projectId) continue;
        const items = fragmentsByProject.get(fragment.projectId) || [];
        items.push(fragment);
        fragmentsByProject.set(fragment.projectId, items);
      }

      const versionsByProject = new Map();
      for (const version of data.articleVersions) {
        if (!version?.projectId) continue;
        const items = versionsByProject.get(version.projectId) || [];
        items.push(version);
        versionsByProject.set(version.projectId, items);
      }

      await Promise.all(
        data.projects.map(async (project) => {
          await saveFragments(project.id, fragmentsByProject.get(project.id) || []);
          await saveVersions(project.id, versionsByProject.get(project.id) || []);
        })
      );

      await Promise.all(
        data.articles
          .filter((article) => article?.projectId)
          .map((article) => saveArticle(article.projectId, article))
      );

      return json(res, {
        ok: true,
        projects: data.projects.length,
        fragments: data.fragments.length,
        articles: data.articles.length,
        articleVersions: data.articleVersions.length,
      });
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    return error(res, err.message || 'Backup failed', 500);
  }
}
