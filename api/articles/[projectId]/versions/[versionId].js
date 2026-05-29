import { getVersions, saveVersions, json, error } from '../../../../_kv.js';

export default async function handler(req, res) {
  try {
    const { projectId, versionId } = req.query;
    const versions = await getVersions(projectId);

    if (req.method === 'GET') {
      const version = versions.find(v => v.id === versionId);
      if (!version) return error(res, 'Version not found', 404);
      json(res, version);
    } else if (req.method === 'DELETE') {
      const idx = versions.findIndex(v => v.id === versionId);
      if (idx === -1) return error(res, 'Version not found', 404);
      versions.splice(idx, 1);
      await saveVersions(projectId, versions);
      json(res, { ok: true });
    } else {
      error(res, 'Method not allowed', 405);
    }
  } catch (err) {
    error(res, err.message, 500);
  }
}