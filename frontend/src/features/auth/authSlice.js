import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from './authApi';
import { setAccessToken, clearAccessToken } from '@/services/axiosInstance';
import { refreshSession } from '@/services/interceptors';

const initialState = {
  user: null,
  isAuthenticated: false,
  bootstrapStatus: 'idle',
  status: 'idle',
  error: null,
};

// Goes through the SAME single-flight refreshSession() as the 401-retry path
// (see services/interceptors.js) instead of calling authApi.refresh() directly.
// That sharing is what prevents React StrictMode's dev-only double-mount from
// firing two concurrent refresh requests and tripping refresh-token
// reuse-detection on page load — see the comment on refreshSession for the
// full mechanism.
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  try {
    const { accessToken, user } = await refreshSession();
    if (!accessToken || !user) throw new Error('No active session');
    setAccessToken(accessToken);
    return user;
  } catch (error) {
    return rejectWithValue(error?.message ?? 'No active session');
  }
});

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { accessToken, user } = await authApi.login(payload);
    setAccessToken(accessToken);
    return user;
  } catch (error) {
    return rejectWithValue(error);
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { accessToken, user } = await authApi.register(payload);
    setAccessToken(accessToken);
    return user;
  } catch (error) {
    return rejectWithValue(error);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } finally {
    clearAccessToken();
  }
});

export const refreshProfile = createAsyncThunk('auth/refreshProfile', async () => {
  const { user } = await authApi.me();
  return user;
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const { user } = await authApi.updateProfile(payload);
      return user;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.bootstrapStatus = 'loading';
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.bootstrapStatus = 'done';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.bootstrapStatus = 'done';
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
      })
      .addCase(refreshProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addMatcher(
        (action) => [login.pending.type, register.pending.type].includes(action.type),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        (action) => [login.fulfilled.type, register.fulfilled.type].includes(action.type),
        (state, action) => {
          state.status = 'succeeded';
          state.user = action.payload;
          state.isAuthenticated = true;
          state.bootstrapStatus = 'done';
        }
      )
      .addMatcher(
        (action) => [login.rejected.type, register.rejected.type].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload?.message ?? 'Authentication failed';
        }
      );
  },
});

export const { sessionExpired, clearAuthError, setUser } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectBootstrapDone = (state) => state.auth.bootstrapStatus === 'done';

// Hoisted so the "no user yet" case returns the SAME object reference on every
// call. `?? { used: 0, limit: 0 }` inline would allocate a fresh object each
// render, which react-redux sees as "the selector's result changed" even
// though the value didn't — hence the "returned a different result" warning
// and the extra rerenders that came with it.
const EMPTY_CREDITS = Object.freeze({ used: 0, limit: 0 });
export const selectCredits = (state) => state.auth.user?.aiCredits ?? EMPTY_CREDITS;

export default authSlice.reducer;
