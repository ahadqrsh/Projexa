import { api } from '@/services/axiosInstance';
import { endpoints } from '@/services/endpoints';
import { unwrap, unwrapMeta } from '@/services/interceptors';

export const projectApi = {
  list: (params) =>
    api.get(endpoints.projects.root, { params }).then((res) => ({
      projects: unwrap(res).projects,
      meta: unwrapMeta(res),
    })),
  stats: () => api.get(endpoints.projects.stats).then(unwrap),
  getById: (id) => api.get(endpoints.projects.byId(id)).then(unwrap),
  create: (payload) => api.post(endpoints.projects.root, payload).then(unwrap),
  update: (id, payload) => api.patch(endpoints.projects.byId(id), payload).then(unwrap),
  remove: (id) => api.delete(endpoints.projects.byId(id)),
  restore: (id) => api.post(endpoints.projects.restore(id)).then(unwrap),
  duplicate: (id) => api.post(endpoints.projects.duplicate(id)).then(unwrap),
  toggleBookmark: (id) => api.post(endpoints.projects.bookmark(id)).then(unwrap),
  setVisibility: (id, visibility) =>
    api.patch(endpoints.projects.visibility(id), { visibility }).then(unwrap),
  setStatus: (id, status) => api.patch(endpoints.projects.status(id), { status }).then(unwrap),
  history: (id) => api.get(endpoints.projects.history(id)).then(unwrap).then((d) => d.events),
  /**
   * Exports return raw bytes, not the usual JSON envelope, so this bypasses
   * `unwrap` and instead reads the filename straight off Content-Disposition —
   * the one place the server and client must agree on a naming convention.
   */
  export: async (id, { format = 'pdf', modules } = {}) => {
    const params = { format };
    if (modules?.length) params.modules = modules.join(',');
    const res = await api.get(endpoints.projects.export(id), { params, responseType: 'blob' });
    const disposition = res.headers['content-disposition'] ?? '';
    const match = disposition.match(/filename="([^"]+)"/);
    return { blob: res.data, filename: match?.[1] ?? `export.${format}` };
  },
  uploadCover: (id, file) => {
    const form = new FormData();
    form.append('coverImage', file);
    return api
      .patch(endpoints.projects.cover(id), form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap);
  },
};

export default projectApi;
