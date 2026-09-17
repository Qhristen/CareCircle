import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserDto } from '@/types';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  authChecked: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  authChecked: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: UserDto }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.authChecked = true;
    },
    setUser: (state, action: PayloadAction<UserDto>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.authChecked = true;
    },
    markAuthChecked: (state) => {
      state.authChecked = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true;
    },
  },
});

export const { setCredentials, setUser, markAuthChecked, logout } = authSlice.actions;
export default authSlice.reducer;
