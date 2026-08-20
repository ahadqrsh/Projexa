export const paths = {
  landing: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: (token = ':token') => `/reset-password/${token}`,
  verifyEmail: (token = ':token') => `/verify-email/${token}`,

  dashboard: '/dashboard',
  projects: '/projects',
  newProject: '/projects/new',
  project: (id = ':id') => `/projects/${id}`,
  editProject: (id = ':id') => `/projects/${id}/edit`,
  artifact: (id = ':id', type = ':type') => `/projects/${id}/artifacts/${type}`,
  diagram: (id = ':id', type = ':type') => `/projects/${id}/diagrams/${type}`,

  profile: '/profile',
  settings: '/settings',

  forbidden: '/403',
  notFound: '*',
};

export default paths;
