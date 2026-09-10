/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { nextTick } from "vue";
import { flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountWithPlugins } from "./testUtils.js";
import Register from "../src/views/Register.vue";
import authServices from "../src/services/authServices.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

async function fillRegisterForm(wrapper, values = {}) {
  const defaults = {
    fName: "Jane",
    lName: "Doe",
    email: "jdoe@example.com",
    username: "jdoe",
    password: "password123",
    confirmPassword: "password123",
    ...values,
  };

  const textFields = wrapper.findAllComponents({ name: "VTextField" });
  await textFields[0].find("input").setValue(defaults.fName);
  await textFields[1].find("input").setValue(defaults.lName);
  await textFields[2].find("input").setValue(defaults.email);
  await textFields[3].find("input").setValue(defaults.username);
  await textFields[4].find("input").setValue(defaults.password);
  await textFields[5].find("input").setValue(defaults.confirmPassword);
  await nextTick();
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        attachTo: document.body,
      });

      await fillRegisterForm(wrapper, { email: "notanemail" });
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        attachTo: document.body,
      });

      await fillRegisterForm(wrapper, { username: "" });
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Username is required.");
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        attachTo: document.body,
      });

      await fillRegisterForm(wrapper, {
        password: "short",
        confirmPassword: "short",
      });
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        attachTo: document.body,
      });

      await fillRegisterForm(wrapper, {
        password: "password123",
        confirmPassword: "password456",
      });
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
