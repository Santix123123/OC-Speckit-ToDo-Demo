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

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const INVALID_DUE_DATE_MESSAGE =
  "Due date must be a valid date in YYYY-MM-DD format.";

function isValidDueDate(value) {
  if (!DATE_ONLY_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function parseDueDate(value) {
  if (value === undefined) {
    return { omitted: true };
  }

  if (value === null || value === "") {
    return { dueDate: null };
  }

  const dateString = String(value).trim();
  if (!isValidDueDate(dateString)) {
    return { error: INVALID_DUE_DATE_MESSAGE };
  }

  return { dueDate: dateString };
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

    const dueDateResult = parseDueDate(req.body?.dueDate);
    if (dueDateResult.error) {
      return res.status(400).send({ message: dueDateResult.error });
    }

    const todo = await Todo.create({
      title: String(req.body.title).trim(),
      listId: list.id,
      userId: req.user.id,
      completed: false,
      dueDate: dueDateResult.omitted ? null : dueDateResult.dueDate,
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

    if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
      const dueDateResult = parseDueDate(req.body.dueDate);
      if (dueDateResult.error) {
        return res.status(400).send({ message: dueDateResult.error });
      }
      if (!dueDateResult.omitted) {
        todo.dueDate = dueDateResult.dueDate;
      }
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
