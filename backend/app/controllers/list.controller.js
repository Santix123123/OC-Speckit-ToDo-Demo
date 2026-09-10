import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const List = db.list;
const exports = {};

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateListName(name) {
  if (isBlank(name)) {
    return "List name is required.";
  }

  if (String(name).trim().length > 100) {
    return "List name must be 100 characters or fewer.";
  }

  return null;
}

exports.findAll = async (req, res) => {
  try {
    const lists = await List.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.status(200).send(lists);
  } catch (err) {
    logger.error(`List findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load lists." });
  }
};

exports.create = async (req, res) => {
  try {
    const nameError = validateListName(req.body?.name);
    if (nameError) {
      return res.status(400).send({ message: nameError });
    }

    const list = await List.create({
      name: String(req.body.name).trim(),
      userId: req.user.id,
    });

    return res.status(201).send(list);
  } catch (err) {
    logger.error(`List create failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create list." });
  }
};

exports.update = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const nameError = validateListName(req.body?.name);
    if (nameError) {
      return res.status(400).send({ message: nameError });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res
        .status(404)
        .send({ message: `List with id=${listId} not found.` });
    }

    list.name = String(req.body.name).trim();
    await list.save();

    return res.status(200).send(list);
  } catch (err) {
    logger.error(`List update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update list." });
  }
};

exports.delete = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res
        .status(404)
        .send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();
    return res.status(200).send({ message: "List deleted." });
  } catch (err) {
    logger.error(`List delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete list." });
  }
};

export default exports;
