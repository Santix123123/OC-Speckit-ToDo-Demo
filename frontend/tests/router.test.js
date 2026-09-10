/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import Utils from "../src/config/utils.js";
import Home from "../src/views/Home.vue";
import Login from "../src/views/Login.vue";
import Register from "../src/views/Register.vue";

async function createAppRouter(initialPath = "/") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: Home },
      { path: "/login", name: "login", component: Login },
      { path: "/register", name: "register", component: Register },
    ],
  });

  router.beforeEach((to) => {
    const user = Utils.getStore("user");
    const isAuthRoute = to.name === "login" || to.name === "register";

    if (!user && !isAuthRoute) {
      return { name: "login" };
    }

    if (user && isAuthRoute) {
      return { name: "home" };
    }

    return true;
  });

  await router.push(initialPath);
  await router.isReady();
  return router;
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", {
        userId: 1,
        username: "jdoe",
        fName: "Jane",
        token: "test-token",
        role: "worker",
      });

      const router = await createAppRouter("/login");
      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const router = await createAppRouter("/");
      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
