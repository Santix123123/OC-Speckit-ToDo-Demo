/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  authHeader,
  createList,
} from "./helpers.js";

describe("Feature 2 — Todo List Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const { res: userRes } = await registerUser();
      const token = userRes.body.token;

      const res = await createList(token, "Groceries");

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        name: "Groceries",
        userId: userRes.body.userId,
      });
      expect(res.body.userId).toBe(userRes.body.userId);
    });

    it("User creates a list with an empty name", async () => {
      const { res: userRes } = await registerUser();

      const res = await createList(userRes.body.token, "   ");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "List name is required." });
    });

    it("User creates a list with a name that is too long", async () => {
      const { res: userRes } = await registerUser();
      const longName = "a".repeat(101);

      const res = await createList(userRes.body.token, longName);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "List name must be 100 characters or fewer.",
      });
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const { res: userRes } = await registerUser();
      const token = userRes.body.token;

      await createList(token, "Work");
      await createList(token, "Personal");

      const res = await request(app)
        .get("/todo/lists")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
        fName: "Bob",
        lName: "Builder",
      });

      await createList(userB.body.token, "Secret Project");
      await createList(userA.body.token, "Mine");

      const res = await request(app)
        .get("/todo/lists")
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.every((list) => list.userId === userA.body.userId)).toBe(
        true
      );
      expect(res.body.map((list) => list.name)).not.toContain("Secret Project");
      expect(res.body.map((list) => list.name)).toContain("Mine");
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const { res: userRes } = await registerUser();
      const token = userRes.body.token;
      const created = await createList(token, "Groceries");

      const res = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(authHeader(token))
        .send({ name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.body.id,
        name: "Shopping",
        userId: userRes.body.userId,
      });
    });

    it("User deletes a list", async () => {
      const { res: userRes } = await registerUser();
      const token = userRes.body.token;
      const created = await createList(token, "Groceries");

      const res = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(authHeader(token));

      expect([200, 204]).toContain(res.status);

      const remaining = await request(app)
        .get("/todo/lists")
        .set(authHeader(token));
      expect(remaining.body.map((list) => list.name)).not.toContain(
        "Groceries"
      );
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await createList(userB.body.token, "Bob List");

      const res = await request(app)
        .put(`/todo/lists/${listB.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });

      const stored = await db.list.findByPk(listB.body.id);
      expect(stored.name).toBe("Bob List");
    });

    it("User attempts to delete another user's list", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await createList(userB.body.token, "Bob List");

      const res = await request(app)
        .delete(`/todo/lists/${listB.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });

      const stored = await db.list.findByPk(listB.body.id);
      expect(stored).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const { res: userA } = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const { res: userB } = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });

      const res = await createList(userA.body.token, "Groceries", {
        userId: userB.body.userId,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(userB.body.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
