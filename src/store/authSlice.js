import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/auth/me");
    return res.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.error || "Failed to fetch user");
  }
});

const initialState = {
  user: null,
  token: localStorage.getItem("accessToken"),
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) localStorage.setItem("accessToken", action.payload);
      else localStorage.removeItem("accessToken");
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
      if (action.payload.token) {
        state.token = action.payload.token;
        localStorage.setItem("accessToken", action.payload.token);
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("accessToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed";
      });
  },
});

export const { setToken, setUser, clearAuth } = slice.actions;
export default slice.reducer;


