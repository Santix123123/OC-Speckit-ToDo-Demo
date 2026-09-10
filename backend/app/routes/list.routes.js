import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

/**
 * Feature 1 foundation: authenticated lists read returns an empty array.
 * Feature 2 owns list CRUD and ownership-filtered data.
 */
router.get("/", [authenticate], (_req, res) => {
  res.status(200).send([]);
});

export default router;
