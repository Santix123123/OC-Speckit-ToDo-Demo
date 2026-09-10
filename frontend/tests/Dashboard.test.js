/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { nextTick } from "vue";
import { flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountWithPlugins } from "./testUtils.js";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const sampleLists = [
  { id: 1, name: "Personal", userId: 1 },
  { id: 2, name: "Work", userId: 1 },
];

async function mountDashboard(lists = sampleLists) {
  listServices.getAll.mockResolvedValue({ data: lists });
  const { wrapper } = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
  await flushPromises();
  await nextTick();
  return wrapper;
}

function buttonByText(wrapper, label) {
  return wrapper.findAll("button").find((btn) => btn.text().trim() === label);
}

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const wrapper = await mountDashboard([]);
      listServices.create.mockResolvedValue({
        data: { id: 3, name: "Groceries", userId: 1 },
      });

      await buttonByText(wrapper, "+ New List").trigger("click");
      await flushPromises();
      await nextTick();

      const nameField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await nameField.find("input").setValue("Groceries");
      await buttonByText(wrapper, "Create").trigger("click");
      await flushPromises();
      await nextTick();

      expect(listServices.create).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      const wrapper = await mountDashboard([]);

      await buttonByText(wrapper, "+ New List").trigger("click");
      await flushPromises();
      await nextTick();

      const nameField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await nameField.find("input").setValue("   ");
      await buttonByText(wrapper, "Create").trigger("click");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("List name is required.");
      expect(listServices.create).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      const wrapper = await mountDashboard([]);

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);

      const row = wrapper.findAllComponents({ name: "VListItem" })[0];
      expect(row.text()).toContain("Groceries");
      expect(row.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      listServices.update.mockResolvedValue({
        data: { id: 1, name: "Shopping", userId: 1 },
      });

      await wrapper.find('[aria-label="Edit list"]').trigger("click");
      await flushPromises();
      await nextTick();

      const nameField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await nameField.find("input").setValue("Shopping");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(listServices.update).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      listServices.delete.mockResolvedValue({
        data: { message: "List deleted." },
      });

      await wrapper.find('[aria-label="Delete list"]').trigger("click");
      await flushPromises();
      await nextTick();

      await buttonByText(wrapper, "Delete").trigger("click");
      await flushPromises();
      await nextTick();

      expect(listServices.delete).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });
});
