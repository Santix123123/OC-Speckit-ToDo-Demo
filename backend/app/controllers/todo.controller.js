import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const Todo = db.todo;
const exports = {};

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateTodoTitle(title) {
  if (isBlank(title)) {
    return "Todo title is required.";
  }

  if (String(title).trim().length > 255) {
    return "Todo title must be 255 characters or fewer.";
  }

  return null;
}

exports.findAllForList = async (req, res) => {
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

    const todos = await Todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    return res.status(200).send(todos);
  } catch (err) {
    logger.error(`Todo findAllForList failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load todos." });
  }
};

exports.createForList = async (req, res) => {
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

    const titleError = validateTodoTitle(req.body?.title);
    if (titleError) {
      return res.status(400).send({ message: titleError });
    }

    const todo = await Todo.create({
      title: String(req.body.title).trim(),
      listId: list.id,
      userId: req.user.id,
      completed: false,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Todo createForList failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create todo." });
  }
};

exports.update = async (req, res) => {
  try {
    const todoId = parseInt(req.params.id, 10);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res
        .status(404)
        .send({ message: `Todo with id=${todoId} not found.` });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const titleError = validateTodoTitle(req.body.title);
      if (titleError) {
        return res.status(400).send({ message: titleError });
      }
      todo.title = String(req.body.title).trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      todo.completed = Boolean(req.body.completed);
    }

    await todo.save();
    return res.status(200).send(todo);
  } catch (err) {
    logger.error(`Todo update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.delete = async (req, res) => {
  try {
    const todoId = parseInt(req.params.id, 10);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res
        .status(404)
        .send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.destroy();
    return res.status(200).send({ message: "Todo deleted." });
  } catch (err) {
    logger.error(`Todo delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete todo." });
  }
};

export default exports;
