import { createSlice } from '@reduxjs/toolkit';

const THEME_KEY = 'apm.theme';
const SIDEBAR_KEY = 'apm.sidebar';

const readTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem(THEME_KEY) ?? 'dark';
};

const readSidebar = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIDEBAR_KEY) === 'true';
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: readTheme(),
    sidebarCollapsed: readSidebar(),
    mobileNavOpen: false,
    commandPaletteOpen: false,
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem(THEME_KEY, action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, state.theme);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem(SIDEBAR_KEY, String(state.sidebarCollapsed));
    },
    setMobileNav: (state, action) => {
      state.mobileNavOpen = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
  },
});

export const { setTheme, toggleTheme, toggleSidebar, setMobileNav, toggleCommandPalette } =
  uiSlice.actions;

export const selectTheme = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectMobileNavOpen = (state) => state.ui.mobileNavOpen;

export default uiSlice.reducer;
