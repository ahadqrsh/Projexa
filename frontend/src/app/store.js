import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import projectReducer from '@/features/projects/projectSlice';
import uiReducer from '@/features/ui/uiSlice';
import generationReducer from '@/features/generation/generationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    ui: uiReducer,
    generation: generationReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: { ignoredActions: ['auth/login/rejected', 'projects/create/rejected'] },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

export default store;
