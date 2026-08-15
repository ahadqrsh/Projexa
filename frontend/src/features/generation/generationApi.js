import { api } from '@/services/axiosInstance';
import { endpoints } from '@/services/endpoints';
import { unwrap } from '@/services/interceptors';

export const generationApi = {
  /** Requests a specific set of modules. Returns { jobId, cached, modules, ... } or, if
   *  everything requested is already fresh, { jobId: null, cached, message }. */
  start: (projectId, modules, force = false) =>
    api.post(endpoints.generation.start(projectId), { modules, force }).then(unwrap),

  /** Requests every implemented module in one call. */
  generateAll: (projectId, force = false) =>
    api.post(endpoints.generation.all(projectId), { force }).then(unwrap),

  /** Regenerates exactly one module, always forced (a retry always overwrites). */
  retry: (projectId, type) =>
    api.post(endpoints.generation.retry(projectId, type)).then(unwrap),

  getStatus: (projectId, jobId) =>
    api.get(endpoints.generation.status(projectId, jobId)).then(unwrap),

  cancel: (projectId, jobId) =>
    api.delete(endpoints.generation.cancel(projectId, jobId)).then(unwrap),
};

export default generationApi;
