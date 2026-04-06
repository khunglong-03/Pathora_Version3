import { describe, expect, it, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  setUser,
  setToken,
  setCredentials,
  logOut,
} from "../authSlice";
import type { UserInfo } from "../../domain/auth";

// Helper to build a store with auth slice preloaded
const createAuthStore = (preloadedState?: { auth: ReturnType<typeof authReducer> }) => {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });
};

const mockUser: UserInfo = {
  id: "user-123",
  username: "testuser",
  fullName: "Test User",
  email: "test@example.com",
  avatar: null,
  forcePasswordChange: false,
  roles: [{ type: 1, id: "r1", name: "User" }],
  departments: [],
  portal: "admin",
  defaultPath: "/dashboard",
};

describe("authSlice", () => {
  describe("setCredentials", () => {
    it("sets user, token, and isAuth to true", () => {
      const store = createAuthStore();

      store.dispatch(setCredentials({ user: mockUser, token: "abc-token" }));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe("abc-token");
      expect(state.isAuth).toBe(true);
    });
  });

  describe("setUser", () => {
    it("sets user and isAuth to true when user is provided", () => {
      const store = createAuthStore();

      store.dispatch(setUser(mockUser));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuth).toBe(true);
    });

    it("sets user to null and isAuth to false when null is provided", () => {
      const store = createAuthStore({
        auth: { user: mockUser, token: "abc", isAuth: true },
      });

      store.dispatch(setUser(null));

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuth).toBe(false);
    });
  });

  describe("setToken", () => {
    it("sets the token value", () => {
      const store = createAuthStore();

      store.dispatch(setToken("new-token"));

      expect(store.getState().auth.token).toBe("new-token");
    });

    it("clears token when null is provided", () => {
      const store = createAuthStore({
        auth: { user: null, token: "old-token", isAuth: false },
      });

      store.dispatch(setToken(null));

      expect(store.getState().auth.token).toBeNull();
    });
  });

  describe("logOut", () => {
    it("clears user, token, and isAuth on logout", () => {
      const store = createAuthStore({
        auth: { user: mockUser, token: "abc-token", isAuth: true },
      });

      store.dispatch(logOut());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuth).toBe(false);
    });
  });

  describe("initial state", () => {
    it("starts with isAuth false and null user and token", () => {
      // Clear localStorage to ensure clean initial state for this test
      const store = createAuthStore();
      const state = store.getState().auth;
      // Initial state from the slice (not the real localStorage-backed one)
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      // isAuth depends on localStorage and getValidAccessToken in real app
      // but in the reducer it starts from initialState which has null token
      expect(state.isAuth).toBe(false);
    });
  });
});
