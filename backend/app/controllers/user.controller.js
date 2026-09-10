import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const User = db.user;
const SALT_ROUNDS = 10;
const exports = {};

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function toProfile(user) {
  return {
    id: user.id,
    fName: user.fName,
    lName: user.lName,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

exports.findOne = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res
        .status(404)
        .send({ message: `User with id=${userId} not found.` });
    }

    return res.status(200).send(toProfile(user));
  } catch (err) {
    logger.error(`User findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load profile." });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res
        .status(404)
        .send({ message: `User with id=${userId} not found.` });
    }

    if (isBlank(req.body?.fName)) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (isBlank(req.body?.lName)) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (isBlank(req.body?.email)) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (isBlank(req.body?.username)) {
      return res.status(400).send({ message: "Username is required." });
    }

    const passwordProvided =
      req.body.password !== undefined && req.body.password !== null;
    if (passwordProvided && String(req.body.password).length < 8) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters." });
    }

    const normalizedUsername = String(req.body.username).trim().toLowerCase();
    const normalizedEmail = String(req.body.email).trim();

    const existingUsername = await User.findOne({
      where: {
        username: normalizedUsername,
        id: { [Op.ne]: user.id },
      },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await User.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: user.id },
      },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const scopedUser = await User.unscoped().findByPk(user.id);
    scopedUser.fName = String(req.body.fName).trim();
    scopedUser.lName = String(req.body.lName).trim();
    scopedUser.email = normalizedEmail;
    scopedUser.username = normalizedUsername;

    if (passwordProvided && String(req.body.password).trim() !== "") {
      scopedUser.password = await bcrypt.hash(
        String(req.body.password),
        SALT_ROUNDS
      );
    }

    await scopedUser.save();

    return res.status(200).send(toProfile(scopedUser));
  } catch (err) {
    logger.error(`User update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update profile." });
  }
};

export default exports;
