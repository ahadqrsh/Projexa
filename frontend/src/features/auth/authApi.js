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
    // The axios instance sets a default 'Content-Type: application/json'
    // header for every request. Axios is supposed to auto-delete that for a
    // FormData body so the browser can set its own 'multipart/form-data;
    // boundary=...' header, but in practice the instance-level default wins
    // and the request goes out as application/json — multer then never sees
    // a multipart body at all, so req.file is undefined ("No image file was
    // provided"). Explicitly unsetting it here forces axios to drop the
    // header entirely, which is what actually lets the browser generate the
    // correct multipart header with a boundary.
    return api
      .patch(endpoints.users.avatar, form, { headers: { 'Content-Type': undefined } })
      .then(unwrap);
  },
  removeAvatar: () => api.delete(endpoints.users.avatar).then(unwrap),
  sessions: () => api.get(endpoints.auth.sessions).then(unwrap),
};

export default authApi;
