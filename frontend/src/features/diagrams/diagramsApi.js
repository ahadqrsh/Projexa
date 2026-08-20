import { api } from '@/services/axiosInstance';
import { endpoints } from '@/services/endpoints';
import { unwrap } from '@/services/interceptors';

export const diagramsApi = {
  list: (projectId) => api.get(endpoints.diagrams.list(projectId)).then(unwrap).then((d) => d.diagrams),

  get: (projectId, type) =>
    api.get(endpoints.diagrams.byType(projectId, type)).then(unwrap).then((d) => d.diagram),

  /** Synchronous — the response IS the finished diagram, no job to poll. */
  generate: (projectId, type) =>
    api.post(endpoints.diagrams.generate(projectId, type)).then(unwrap).then((d) => d.diagram),

  update: (projectId, type, { source, title }) =>
    api
      .patch(endpoints.diagrams.byType(projectId, type), { source, title })
      .then(unwrap)
      .then((d) => d.diagram),
};

export default diagramsApi;
