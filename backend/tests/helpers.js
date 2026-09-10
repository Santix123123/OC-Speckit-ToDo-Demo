import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";

/** Sync schema for tests. */
export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const registerUser = async (overrides = {}) => {
  const payload = {
    fName: "Jane",
    lName: "Doe",
    email: "jdoe@example.com",
    username: "jdoe",
    password: "password123",
    ...overrides,
  };

  const res = await request(app).post("/todo/register").send(payload);
  return { res, payload };
};

export const loginUser = async (credentials = {}) => {
  const body = {
    username: "jdoe",
    password: "password123",
    ...credentials,
  };

  const res = await request(app).post("/todo/login").send(body);
  return { res, body };
};

export const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const createList = async (token, name, extra = {}) => {
  const res = await request(app)
    .post("/todo/lists")
    .set(authHeader(token))
    .send({ name, ...extra });
  return res;
};
