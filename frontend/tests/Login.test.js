/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { nextTick } from "vue";
import { flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";
import Login from "../src/views/Login.vue";
import authServices from "../src/services/authServices.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      authServices.loginUser.mockRejectedValue({
        response: {
          status: 401,
          data: { message: "Invalid username or password." },
        },
      });

      const router = await createTestRouter("/login");
      const { wrapper } = await mountWithPlugins(Login, {
        router,
        attachTo: document.body,
      });

      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      await textFields[0].find("input").setValue("jdoe");
      await textFields[1].find("input").setValue("wrong-password");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();
      await nextTick();

      expect(authServices.loginUser).toHaveBeenCalled();
      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.find(".v-alert").text()).toContain(
        "Invalid username or password."
      );
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login, {
        attachTo: document.body,
      });

      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      await textFields[1].find("input").setValue("password123");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Username is required.");
      expect(authServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login, {
        attachTo: document.body,
      });

      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      await textFields[0].find("input").setValue("jdoe");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Password is required.");
      expect(authServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
