import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generationApi } from './generationApi';

/**
 * Jobs are keyed by projectId, not stored as one global "current job" — a user
 * can have the dashboard open in one tab and a project workspace in another,
 * and each project's generation state is independent.
 */
const initialState = {
  jobsByProject: {},
  startStatus: 'idle',
  error: null,
};

const emptyJob = () => ({
  jobId: null,
  overallStatus: 'idle',
  progress: 0,
  modules: [],
  startedAt: null,
  finishedAt: null,
});

export const startGeneration = createAsyncThunk(
  'generation/start',
  async ({ projectId, modules, force = false }, { rejectWithValue }) => {
    try {
      const result = await generationApi.start(projectId, modules, force);
      return { projectId, result };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const generateAll = createAsyncThunk(
  'generation/generateAll',
  async ({ projectId, force = false }, { rejectWithValue }) => {
    try {
      const result = await generationApi.generateAll(projectId, force);
      return { projectId, result };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const retryModule = createAsyncThunk(
  'generation/retry',
  async ({ projectId, type }, { rejectWithValue }) => {
    try {
      const result = await generationApi.retry(projectId, type);
      return { projectId, result };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * One poll. The repeated interval lives in useGenerationPolling — the slice
 * only knows how to apply a single status snapshot, which keeps it a pure
 * reducer rather than something that owns a setInterval.
 */
export const pollJobStatus = createAsyncThunk(
  'generation/poll',
  async ({ projectId, jobId }, { rejectWithValue }) => {
    try {
      const status = await generationApi.getStatus(projectId, jobId);
      return { projectId, status };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const cancelJob = createAsyncThunk(
  'generation/cancel',
  async ({ projectId, jobId }, { rejectWithValue }) => {
    try {
      await generationApi.cancel(projectId, jobId);
      return { projectId };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    clearJob: (state, action) => {
      delete state.jobsByProject[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(pollJobStatus.fulfilled, (state, action) => {
        const { projectId, status } = action.payload;
        state.jobsByProject[projectId] = { ...emptyJob(), ...status };
      })

      .addCase(cancelJob.fulfilled, (state, action) => {
        const job = state.jobsByProject[action.payload.projectId];
        if (job) job.overallStatus = 'cancelled';
      })

      // start / generateAll / retry share identical handling: they all kick
      // off (or short-circuit into a cache hit) exactly one job.
      .addMatcher(
        (action) =>
          [startGeneration.pending.type, generateAll.pending.type, retryModule.pending.type].includes(
            action.type
          ),
        (state) => {
          state.startStatus = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          [
            startGeneration.fulfilled.type,
            generateAll.fulfilled.type,
            retryModule.fulfilled.type,
          ].includes(action.type),
        (state, action) => {
          state.startStatus = 'succeeded';
          const { projectId, result } = action.payload;

          if (!result.jobId) {
            // Everything requested was already fresh — nothing to poll.
            return;
          }

          state.jobsByProject[projectId] = {
            ...emptyJob(),
            jobId: result.jobId,
            overallStatus: 'queued',
            modules: result.modules.map((m) => ({ type: m.type, status: 'queued' })),
          };
        }
      )
      .addMatcher(
        (action) =>
          [startGeneration.rejected.type, generateAll.rejected.type, retryModule.rejected.type].includes(
            action.type
          ),
        (state, action) => {
          state.startStatus = 'failed';
          state.error = action.payload?.message ?? 'Could not start generation';
        }
      );
  },
});

export const { clearJob } = generationSlice.actions;

export const selectJob = (projectId) => (state) => state.generation.jobsByProject[projectId] ?? null;
export const selectIsGenerating = (projectId) => (state) => {
  const job = state.generation.jobsByProject[projectId];
  return Boolean(job && ['queued', 'running'].includes(job.overallStatus));
};
export const selectGenerationError = (state) => state.generation.error;
export const selectStartStatus = (state) => state.generation.startStatus;

export default generationSlice.reducer;
