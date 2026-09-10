/**
 * Feature 2 — Todo List Management
 * Feature 3 — Todo List Item Management
 * Feature 5 — Todo Due Date
 * Spec: features/feature-2-todo-list-management.md
 * Spec: features/feature-3-todo-list-item-management.md
 * Spec: features/feature-5-todo-due-date.md
 */
import { nextTick } from "vue";
import { flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountWithPlugins } from "./testUtils.js";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import { formatDueDate } from "../src/config/validation.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getAllForList: vi.fn(),
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

async function openItems(wrapper, listName, todos = []) {
  todoServices.getAllForList.mockResolvedValue({ data: todos });
  await wrapper
    .find(`[aria-label="View items for ${listName}"]`)
    .trigger("click");
  await flushPromises();
  await nextTick();
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

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", []);
      todoServices.create.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          userId: 1,
        },
      });

      await buttonByText(wrapper, "+ Add Item").trigger("click");
      await flushPromises();
      await nextTick();

      const titleField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await titleField.find("input").setValue("Buy milk");
      await buttonByText(wrapper, "Add").trigger("click");
      await flushPromises();
      await nextTick();

      expect(todoServices.create).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(wrapper.text()).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", []);

      await buttonByText(wrapper, "+ Add Item").trigger("click");
      await flushPromises();
      await nextTick();

      const titleField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await titleField.find("input").setValue("");
      await buttonByText(wrapper, "Add").trigger("click");
      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Todo title is required.");
      expect(todoServices.create).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);

      expect(buttonByText(wrapper, "+ Add Item")).toBeUndefined();
      expect(wrapper.text()).not.toContain("+ Add Item");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Personal", userId: 1 },
      ]);
      await openItems(wrapper, "Personal", []);

      expect(wrapper.text()).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Personal", userId: 1 },
        { id: 2, name: "Work", userId: 1 },
      ]);

      await openItems(wrapper, "Personal", [
        { id: 1, listId: 1, title: "Call mom", completed: false, userId: 1 },
      ]);
      expect(wrapper.text()).toContain("Call mom");
      expect(wrapper.text()).not.toContain("Email client");

      await buttonByText(wrapper, "Close").trigger("click");
      await nextTick();

      await openItems(wrapper, "Work", [
        {
          id: 2,
          listId: 2,
          title: "Email client",
          completed: false,
          userId: 1,
        },
        {
          id: 3,
          listId: 2,
          title: "Write report",
          completed: false,
          userId: 1,
        },
      ]);
      expect(wrapper.text()).toContain("Email client");
      expect(wrapper.text()).toContain("Write report");
      expect(wrapper.text()).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", [
        {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          userId: 1,
        },
      ]);
      todoServices.update.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: true,
          userId: 1,
        },
      });

      const checkbox = wrapper.findComponent({ name: "VCheckbox" });
      await checkbox.vm.$emit("update:modelValue", true);
      await flushPromises();
      await nextTick();

      expect(todoServices.update).toHaveBeenCalledWith(10, { completed: true });
      expect(wrapper.html()).toContain("text-decoration-line-through");
    });

    it("User marks a completed todo as incomplete", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", [
        {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: true,
          userId: 1,
        },
      ]);
      todoServices.update.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          userId: 1,
        },
      });

      const checkbox = wrapper.findComponent({ name: "VCheckbox" });
      await checkbox.vm.$emit("update:modelValue", false);
      await flushPromises();
      await nextTick();

      expect(todoServices.update).toHaveBeenCalledWith(10, {
        completed: false,
      });
      expect(wrapper.html()).not.toContain("text-decoration-line-through");
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", [
        {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          userId: 1,
        },
      ]);
      todoServices.update.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy oat milk",
          completed: false,
          userId: 1,
        },
      });

      await wrapper.find('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();
      await nextTick();

      const titleField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await titleField.find("input").setValue("Buy oat milk");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(todoServices.update).toHaveBeenCalledWith(10, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(wrapper.text()).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", [
        {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          userId: 1,
        },
      ]);
      todoServices.delete.mockResolvedValue({
        data: { message: "Todo deleted." },
      });

      await wrapper.find('[aria-label="Delete todo"]').trigger("click");
      await flushPromises();
      await nextTick();

      await buttonByText(wrapper, "Delete").trigger("click");
      await flushPromises();
      await nextTick();

      expect(todoServices.delete).toHaveBeenCalledWith(10);
      expect(wrapper.text()).not.toContain("Buy milk");
      expect(wrapper.text()).toContain("No todos in this list yet.");
    });
  });
});

function yesterdayIso() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("Feature 5 — Todo Due Date", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", []);
      todoServices.create.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          dueDate: "2026-07-15",
          userId: 1,
        },
      });

      await buttonByText(wrapper, "+ Add Item").trigger("click");
      await flushPromises();
      await nextTick();

      const titleField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await titleField.find("input").setValue("Buy milk");
      await wrapper.find('input[type="date"]').setValue("2026-07-15");
      await buttonByText(wrapper, "Add").trigger("click");
      await flushPromises();
      await nextTick();

      expect(todoServices.create).toHaveBeenCalledWith(1, {
        title: "Buy milk",
        dueDate: "2026-07-15",
      });
      expect(wrapper.text()).toContain("Buy milk");
      expect(wrapper.text()).toContain(formatDueDate("2026-07-15"));
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", [
        {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          dueDate: null,
          userId: 1,
        },
      ]);
      todoServices.update.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          dueDate: "2026-07-20",
          userId: 1,
        },
      });

      await wrapper.find('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();
      await nextTick();

      await wrapper.find('input[type="date"]').setValue("2026-07-20");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(todoServices.update).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(wrapper.text()).toContain(formatDueDate("2026-07-20"));
    });

    it("User clears a due date when editing a todo", async () => {
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", [
        {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          dueDate: "2026-07-20",
          userId: 1,
        },
      ]);
      todoServices.update.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          dueDate: null,
          userId: 1,
        },
      });

      await wrapper.find('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();
      await nextTick();

      await wrapper.find('input[type="date"]').setValue("");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      await nextTick();

      expect(todoServices.update).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: null,
      });
      expect(wrapper.text()).toContain("Buy milk");
      expect(wrapper.text()).not.toContain(formatDueDate("2026-07-20"));
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const dueDate = yesterdayIso();
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", [
        {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          dueDate,
          userId: 1,
        },
      ]);

      const dueEl = wrapper.find(".todo-due-date");
      expect(dueEl.exists()).toBe(true);
      expect(dueEl.text()).toContain(formatDueDate(dueDate));
      expect(dueEl.classes()).toContain("todo-due-date--overdue");
      expect(dueEl.classes()).toContain("text-error");
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const dueDate = yesterdayIso();
      const wrapper = await mountDashboard([
        { id: 1, name: "Groceries", userId: 1 },
      ]);
      await openItems(wrapper, "Groceries", [
        {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: true,
          dueDate,
          userId: 1,
        },
      ]);

      const dueEl = wrapper.find(".todo-due-date");
      expect(dueEl.exists()).toBe(true);
      expect(dueEl.text()).toContain(formatDueDate(dueDate));
      expect(dueEl.classes()).not.toContain("todo-due-date--overdue");
      expect(dueEl.classes()).not.toContain("text-error");
    });
  });
});
