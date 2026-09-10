import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const User = db.user;
const Session = db.session;
const SALT_ROUNDS = 10;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const exports = {};

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function buildAuthPayload(user, token) {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    role: user.role,
    token,
  };
}

async function getOrCreateSession(user) {
  const now = new Date();
  const existing = await Session.findOne({
    where: { userId: user.id },
    order: [["expirationDate", "DESC"]],
  });

  if (existing && new Date(existing.expirationDate) > now && existing.token) {
    return existing.token;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, {
    expiresIn: 86400,
  });

  await Session.create({
    token,
    email: user.email,
    userId: user.id,
    expirationDate: new Date(now.getTime() + SESSION_TTL_MS),
  });

  return token;
}

exports.register = async (req, res) => {
  try {
    const { fName, lName, email, username, password } = req.body;

    if (isBlank(fName)) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (isBlank(lName)) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (isBlank(email)) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (isBlank(username)) {
      return res.status(400).send({ message: "Username is required." });
    }
    if (isBlank(password)) {
      return res.status(400).send({ message: "Password is required." });
    }
    if (String(password).length < 8) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters." });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedEmail = String(email).trim();

    const existingUsername = await User.findOne({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);

    const user = await User.create({
      fName: String(fName).trim(),
      lName: String(lName).trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      role: "worker",
    });

    const token = await getOrCreateSession(user);

    return res.status(201).send(buildAuthPayload(user, token));
  } catch (err) {
    logger.error(`Register failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to register user." });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (isBlank(username)) {
      return res.status(400).send({ message: "Username is required." });
    }
    if (isBlank(password)) {
      return res.status(400).send({ message: "Password is required." });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const user = await User.unscoped().findOne({
      where: { username: normalizedUsername },
    });

    if (!user) {
      return res
        .status(401)
        .send({ message: "Invalid username or password." });
    }

    const passwordValid = await bcrypt.compare(String(password), user.password);
    if (!passwordValid) {
      return res
        .status(401)
        .send({ message: "Invalid username or password." });
    }

    const token = await getOrCreateSession(user);

    return res.status(200).send(buildAuthPayload(user, token));
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to sign in." });
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).send({ message: "Unauthorized! No token provided." });
    }

    const session = await Session.findOne({ where: { token } });
    if (session) {
      session.token = "";
      await session.save();
    }

    return res.status(200).send({ message: "Signed out." });
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to sign out." });
  }
};

export default exports;
