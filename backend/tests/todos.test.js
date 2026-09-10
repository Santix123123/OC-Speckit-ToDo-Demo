/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  authHeader,
  createList,
  createTodo,
} from "./helpers.js";

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const { res: userRes } = await registerUser();
      const list = await createList(userRes.body.token, "Groceries");

      const res = await createTodo(
        userRes.body.token,
        list.body.id,
        "Buy milk"
      );

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        title: "Buy milk",
        completed: false,
        userId: userRes.body.userId,
        listId: list.body.id,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const { res: userRes } = await registerUser();
      const list = await createList(userRes.body.token, "Groceries");

      const res = await createTodo(userRes.body.token, list.body.id, "   ");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Todo title is required." });
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });

      const listA = await createList(userA.body.token, "Work");
      const listB = await createList(userB.body.token, "Work");
      await createTodo(userA.body.token, listA.body.id, "My task");
      await createTodo(userB.body.token, listB.body.id, "Their task");

      const res = await request(app)
        .get(`/todo/lists/${listA.body.id}/todos`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((todo) => todo.title)).toEqual(["My task"]);
      expect(res.body.map((todo) => todo.title)).not.toContain("Their task");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const { res: userRes } = await registerUser();
      const list = await createList(userRes.body.token, "Groceries");
      const todo = await createTodo(
        userRes.body.token,
        list.body.id,
        "Buy milk"
      );

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(userRes.body.token))
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const { res: userRes } = await registerUser();
      const list = await createList(userRes.body.token, "Groceries");
      const todo = await createTodo(
        userRes.body.token,
        list.body.id,
        "Buy milk"
      );
      await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(userRes.body.token))
        .send({ completed: true });

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(userRes.body.token))
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const { res: userRes } = await registerUser();
      const list = await createList(userRes.body.token, "Groceries");
      const todo = await createTodo(
        userRes.body.token,
        list.body.id,
        "Buy milk"
      );

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(userRes.body.token))
        .send({ title: "Buy oat milk" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const { res: userRes } = await registerUser();
      const list = await createList(userRes.body.token, "Groceries");
      const todo = await createTodo(
        userRes.body.token,
        list.body.id,
        "Buy milk"
      );

      const res = await request(app)
        .delete(`/todo/todos/${todo.body.id}`)
        .set(authHeader(userRes.body.token));

      expect([200, 204]).toContain(res.status);

      const remaining = await request(app)
        .get(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(userRes.body.token));
      expect(remaining.body.map((t) => t.title)).not.toContain("Buy milk");
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await createList(userB.body.token, "Secret");
      await createTodo(userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .get(`/todo/lists/${listB.body.id}/todos`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });
      expect(JSON.stringify(res.body)).not.toContain("Hidden task");
    });

    it("User attempts to add a todo to another user's list", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await createList(userB.body.token, "Secret");

      const res = await createTodo(
        userA.body.token,
        listB.body.id,
        "Intruder task"
      );

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });

      const todos = await db.todo.findAll({ where: { listId: listB.body.id } });
      expect(todos.map((t) => t.title)).not.toContain("Intruder task");
    });

    it("User attempts to rename another user's todo", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await createList(userB.body.token, "Secret");
      const todoB = await createTodo(
        userB.body.token,
        listB.body.id,
        "Bob task"
      );

      const res = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ title: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });

      const stored = await db.todo.findByPk(todoB.body.id);
      expect(stored.title).toBe("Bob task");
    });

    it("User attempts to delete another user's todo", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await createList(userB.body.token, "Secret");
      const todoB = await createTodo(
        userB.body.token,
        listB.body.id,
        "Bob task"
      );

      const res = await request(app)
        .delete(`/todo/todos/${todoB.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });

      const stored = await db.todo.findByPk(todoB.body.id);
      expect(stored).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listA = await createList(userA.body.token, "Groceries");

      const res = await createTodo(userA.body.token, listA.body.id, "Buy milk", {
        userId: userB.body.userId,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(userB.body.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const res = await request(app).get("/todo/lists/1/todos");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const { res: userRes } = await registerUser();
      const list = await createList(userRes.body.token, "Groceries");
      const milk = await createTodo(
        userRes.body.token,
        list.body.id,
        "Buy milk"
      );
      const eggs = await createTodo(
        userRes.body.token,
        list.body.id,
        "Buy eggs"
      );

      const res = await request(app)
        .delete(`/todo/lists/${list.body.id}`)
        .set(authHeader(userRes.body.token));

      expect(res.status).toBe(200);
      expect(await db.todo.findByPk(milk.body.id)).toBeNull();
      expect(await db.todo.findByPk(eggs.body.id)).toBeNull();
    });
  });
});
