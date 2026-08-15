import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from './projectApi';

const initialFilters = { search: '', status: '', domain: '', difficulty: '', sort: '-updatedAt' };

const initialState = {
  items: [],
  meta: { page: 1, limit: 12, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  filters: initialFilters,
  active: null,
  activeArtifacts: [],
  stats: null,
  listStatus: 'idle',
  detailStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
};

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

export const fetchProjects = createAsyncThunk(
  'projects/list',
  async (overrides = {}, { getState, rejectWithValue }) => {
    const { filters, meta } = getState().projects;
    try {
      return await projectApi.list(
        cleanParams({ page: meta.page, limit: meta.limit, ...filters, ...overrides })
      );
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchProjectStats = createAsyncThunk('projects/stats', async () => projectApi.stats());

export const fetchProject = createAsyncThunk(
  'projects/detail',
  async (id, { rejectWithValue }) => {
    try {
      return await projectApi.getById(id);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { project } = await projectApi.create(payload);
      return project;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await projectApi.update(id, payload);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await projectApi.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const duplicateProject = createAsyncThunk('projects/duplicate', async (id) => {
  const { project } = await projectApi.duplicate(id);
  return project;
});

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      Object.assign(state.filters, action.payload);
      state.meta.page = 1;
    },
    resetFilters: (state) => {
      state.filters = { ...initialFilters };
      state.meta.page = 1;
    },
    setPage: (state, action) => {
      state.meta.page = action.payload;
    },
    clearActive: (state) => {
      state.active = null;
      state.activeArtifacts = [];
      state.detailStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.items = action.payload.projects ?? [];
        if (action.payload.meta) state.meta = action.payload.meta;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.payload?.message ?? 'Could not load projects';
      })

      .addCase(fetchProjectStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      .addCase(fetchProject.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.active = action.payload.project;
        state.activeArtifacts = action.payload.artifacts ?? [];
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.payload?.message ?? 'Could not load this project';
      })

      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.mutationStatus = 'succeeded';
      })
      .addCase(createProject.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.payload?.message ?? 'Could not create the project';
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const updated = action.payload.project;
        state.active = updated;
        const index = state.items.findIndex((p) => p._id === updated._id);
        if (index !== -1) state.items[index] = { ...state.items[index], ...updated };
        state.mutationStatus = 'succeeded';
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.payload?.message ?? 'Could not update the project';
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
        state.meta.total = Math.max(state.meta.total - 1, 0);
      })
      .addCase(duplicateProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      .addMatcher(
        (action) => action.type.startsWith('projects/') && action.type.endsWith('/pending'),
        (state, action) => {
          if (['projects/create', 'projects/update'].some((t) => action.type.startsWith(t))) {
            state.mutationStatus = 'loading';
            state.error = null;
          }
        }
      );
  },
});

export const { setFilter, resetFilters, setPage, clearActive } = projectSlice.actions;

export const selectProjects = (state) => state.projects.items;
export const selectProjectMeta = (state) => state.projects.meta;
export const selectProjectFilters = (state) => state.projects.filters;
export const selectActiveProject = (state) => state.projects.active;
export const selectActiveArtifacts = (state) => state.projects.activeArtifacts;
export const selectProjectStats = (state) => state.projects.stats;
export const selectListStatus = (state) => state.projects.listStatus;
export const selectDetailStatus = (state) => state.projects.detailStatus;
export const selectMutationStatus = (state) => state.projects.mutationStatus;

export default projectSlice.reducer;
