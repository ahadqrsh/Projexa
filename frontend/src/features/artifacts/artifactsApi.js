import { api } from '@/services/axiosInstance';
import { endpoints } from '@/services/endpoints';
import { unwrap } from '@/services/interceptors';

export const artifactsApi = {
  list: (projectId) => api.get(endpoints.artifacts.list(projectId)).then(unwrap),

  get: (projectId, type) =>
    api.get(endpoints.artifacts.byType(projectId, type)).then(unwrap).then((d) => d.artifact),

  update: (projectId, type, content) =>
    api
      .patch(endpoints.artifacts.byType(projectId, type), { content })
      .then(unwrap)
      .then((d) => d.artifact),

  versions: (projectId, type) => api.get(endpoints.artifacts.versions(projectId, type)).then(unwrap),

  restore: (projectId, type, version) =>
    api
      .post(endpoints.artifacts.restore(projectId, type, version))
      .then(unwrap)
      .then((d) => d.artifact),
};

export default artifactsApi;
