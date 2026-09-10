/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import { nextTick } from "vue";
import { flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountWithPlugins } from "./testUtils.js";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import userServices from "../src/services/userServices.js";
import authServices from "../src/services/authServices.js";

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
    loginUser: vi.fn(),
    registerUser: vi.fn(),
  },
}));

const sampleUser = {
  userId: 42,
  username: "jdoe",
  email: "jdoe@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "worker",
  token: "test-token",
};

function storeUser(overrides = {}) {
  Utils.setStore("user", { ...sampleUser, ...overrides });
}

async function mountMenuBar() {
  const { wrapper, router } = await mountWithPlugins(
    {
      components: { MenuBar },
      template: "<v-app><MenuBar /></v-app>",
    },
    {
      attachTo: document.body,
    }
  );
  await flushPromises();
  await nextTick();
  return { wrapper, router };
}

function buttonByText(wrapper, label) {
  return wrapper.findAll("button").find((btn) => btn.text().trim() === label);
}

async function openProfileMenu(wrapper) {
  await wrapper.find('[aria-label="Open profile menu"]').trigger("click");
  await flushPromises();
  await nextTick();
}

async function openEditDialog(wrapper) {
  await openProfileMenu(wrapper);
  await buttonByText(wrapper, "Edit Profile").trigger("click");
  await flushPromises();
  await nextTick();
}

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    storeUser();
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { wrapper } = await mountMenuBar();
      await openProfileMenu(wrapper);

      expect(wrapper.text()).toContain("Jane Doe");
      expect(wrapper.text()).toContain("jdoe");
      expect(wrapper.text()).toContain("jdoe@example.com");
      expect(buttonByText(wrapper, "Edit Profile")).toBeTruthy();
      expect(buttonByText(wrapper, "Log out")).toBeTruthy();
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      expect(wrapper.text()).toContain("Edit Profile");
      const fields = wrapper.findAllComponents({ name: "VTextField" });
      expect(fields[0].find("input").element.value).toBe("Jane");
      expect(fields[1].find("input").element.value).toBe("Doe");
      expect(fields[2].find("input").element.value).toBe("jdoe@example.com");
      expect(fields[3].find("input").element.value).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].find("input").setValue("Janet");
      await buttonByText(wrapper, "Cancel").trigger("click");
      await flushPromises();
      await nextTick();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
    });

    it("User saves profile changes", async () => {
      userServices.updateUser.mockResolvedValue({
        data: {
          id: 42,
          fName: "Janet",
          lName: "Smith",
          email: "janet@example.com",
          username: "jsmith",
          role: "worker",
        },
      });

      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].find("input").setValue("Janet");
      await fields[1].find("input").setValue("Smith");
      await fields[2].find("input").setValue("janet@example.com");
      await fields[3].find("input").setValue("jsmith");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(userServices.updateUser).toHaveBeenCalledWith(42, {
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });
      expect(Utils.getStore("user")).toMatchObject({
        userId: 42,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
        token: "test-token",
      });

      await openProfileMenu(wrapper);
      expect(wrapper.text()).toContain("Janet Smith");
      expect(wrapper.text()).toContain("jsmith");
      expect(wrapper.text()).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[2].find("input").setValue("notanemail");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[4].find("input").setValue("password123");
      await fields[5].find("input").setValue("password456");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[4].find("input").setValue("short");
      await fields[5].find("input").setValue("short");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: { status: 400, data: { message: "Username is already taken." } },
      });

      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.find(".v-alert").text()).toContain(
        "Username is already taken."
      );
      expect(wrapper.text()).toContain("Edit Profile");
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      authServices.logoutUser.mockResolvedValue({
        data: { message: "Signed out." },
      });

      const { wrapper, router } = await mountMenuBar();
      const pushSpy = vi.spyOn(router, "push");
      await openProfileMenu(wrapper);
      await buttonByText(wrapper, "Log out").trigger("click");
      await flushPromises();
      await nextTick();
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(pushSpy).toHaveBeenCalledWith({ name: "login" });
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { wrapper } = await mountMenuBar();

      expect(wrapper.text()).not.toContain("Sign out");
    });
  });
});
