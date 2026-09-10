/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, registerUser, loginUser } from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const { res } = await registerUser();

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        email: "jdoe@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "worker",
        token: expect.any(String),
      });
      expect(res.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findByPk(res.body.userId);
      expect(stored).not.toBeNull();
      expect(stored.password).not.toBe("password123");
      expect(await bcrypt.compare("password123", stored.password)).toBe(true);
    });

    it("User submits registration with missing email", async () => {
      const res = await request(app).post("/todo/register").send({
        fName: "Jane",
        lName: "Doe",
        username: "jdoe",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is required." });
    });

    it("User submits registration with password too short", async () => {
      const res = await request(app).post("/todo/register").send({
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
        password: "short",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
    });

    it("User registers with a duplicate username", async () => {
      await registerUser();

      const res = await request(app).post("/todo/register").send({
        fName: "John",
        lName: "Smith",
        email: "other@example.com",
        username: "jdoe",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });
    });

    it("User registers with a duplicate email", async () => {
      await registerUser({ email: "jane@example.com", username: "jane1" });

      const res = await request(app).post("/todo/register").send({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jane2",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      await registerUser();

      const { res } = await loginUser({
        username: "jdoe",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        token: expect.any(String),
        role: "worker",
      });

      const sessions = await db.session.findAll({
        where: { userId: res.body.userId },
      });
      expect(sessions.length).toBeGreaterThanOrEqual(1);
      expect(sessions.some((s) => s.token === res.body.token)).toBe(true);
    });

    it("User signs in with invalid password", async () => {
      await registerUser();

      const { res } = await loginUser({
        username: "jdoe",
        password: "wrong-password",
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        message: "Invalid username or password.",
      });
    });

    it("User signs in with missing username", async () => {
      const res = await request(app)
        .post("/todo/login")
        .send({ password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is required." });
    });

    it("User signs in with missing password", async () => {
      const res = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const { res: registerRes } = await registerUser();
      const token = registerRes.body.token;

      const logoutRes = await request(app)
        .post("/todo/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);

      const session = await db.session.findOne({
        where: { userId: registerRes.body.userId },
      });
      expect(session.token).toBe("");

      const protectedRes = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${token}`);
      expect(protectedRes.status).toBe(401);
    });
  });
});
