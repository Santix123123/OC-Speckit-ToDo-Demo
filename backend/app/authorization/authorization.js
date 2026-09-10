import db from "../models/index.js";

const Session = db.session;
const User = db.user;

/**
 * Validate Bearer token against the sessions table and attach req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .send({ message: "Unauthorized! No token provided." });
    }

    const session = await Session.findOne({
      where: { token },
      include: [{ model: User, as: "user" }],
    });

    if (!session || !session.user) {
      return res
        .status(401)
        .send({ message: "Unauthorized! Invalid or revoked token." });
    }

    if (new Date(session.expirationDate) < new Date()) {
      return res
        .status(401)
        .send({ message: "Unauthorized! Token has expired." });
    }

    req.user = {
      id: session.user.id,
      role: session.user.role,
    };

    return next();
  } catch (err) {
    return res
      .status(401)
      .send({ message: "Unauthorized! Unable to authenticate." });
  }
}
