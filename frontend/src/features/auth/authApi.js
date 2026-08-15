import { api } from '@/services/axiosInstance';
import { endpoints } from '@/services/endpoints';
import { unwrap } from '@/services/interceptors';

export const authApi = {
  register: (payload) => api.post(endpoints.auth.register, payload).then(unwrap),
  login: (payload) => api.post(endpoints.auth.login, payload).then(unwrap),
  logout: () => api.post(endpoints.auth.logout),
  refresh: () => api.post(endpoints.auth.refresh).then(unwrap),
  forgotPassword: (email) => api.post(endpoints.auth.forgotPassword, { email }).then(unwrap),
  resetPassword: (token, password) =>
    api.post(endpoints.auth.resetPassword(token), { password }).then(unwrap),
  verifyEmail: (token) => api.post(endpoints.auth.verifyEmail(token)).then(unwrap),
  changePassword: (payload) => api.post(endpoints.auth.changePassword, payload).then(unwrap),
  me: () => api.get(endpoints.users.me).then(unwrap),
  updateProfile: (payload) => api.patch(endpoints.users.me, payload).then(unwrap),
  updatePreferences: (payload) => api.patch(endpoints.users.preferences, payload).then(unwrap),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api
      .patch(endpoints.users.avatar, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap);
  },
  removeAvatar: () => api.delete(endpoints.users.avatar).then(unwrap),
  sessions: () => api.get(endpoints.auth.sessions).then(unwrap),
};

export default authApi;
