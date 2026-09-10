# Behavior & Rules Reference

**Living snapshot** of product rules currently in force after Features 1–2.

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Login uses **username + password** (not email-only) | `POST /todo/login`; username normalized `trim().toLowerCase()` | Feature 1 FR-001 |
| Registration collects fName, lName, email, username, password | `POST /todo/register` + Register view | Feature 1 FR-002 |
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hash never returned | Register/login APIs; user `defaultScope` | Feature 1 FR-003 |
| Sessions use JWT + `sessions` table; client sends `Authorization: Bearer <token>` | Auth controller + `authenticate` middleware + axios client | Feature 1 FR-004 |
| Session lifetime is 24 hours | JWT `expiresIn: 86400` + `expirationDate` | Feature 1 FR-005 |
| Login reuses a non-expired session for the same user | `getOrCreateSession` | Feature 1 FR-006 |
| Default role for new users is `worker` | `User.create` / model default | Feature 1 FR-007 |
| Authenticated requests resolve `req.user.id` from session token | `authenticate` middleware | Feature 1 FR-008 |
| Registration email validation uses shared `emailRules` | `frontend/src/config/validation.js` + Register view | Feature 1 FR-009 |
| Duplicate username → `400` `"Username is already taken."` | Auth controller | Feature 1 AC |
| Duplicate email → `400` `"Email is already registered."` | Auth controller | Feature 1 AC |
| Invalid credentials → `401` `"Invalid username or password."` | Auth controller | Feature 1 AC |
| Missing/expired/revoked token → `401` Unauthorized | `authenticate`; frontend clears `localStorage` `user` and redirects to login | Feature 1 AC |
| Client session stored under `localStorage` key `user` | `Utils.setStore` / `removeItem` | Feature 1 AC |
| Unauthenticated users cannot access non-auth routes | `router.beforeEach` → login | Feature 1 US-1.5 / Feature 2 US-2.5 |
| Signed-in users hitting login/register are redirected home | `router.beforeEach` | Feature 1 US-1.3 |
| `MenuBar` shows signed-in name + **Sign out**; hidden on login/register | `App.vue` + `MenuBar.vue` | Feature 2 Screen Requirements |
| Dashboard is a single-view lists UI (`Dashboard.vue`) — no sidebar split | `router` `home` → `Dashboard.vue` | Feature 2 FR-007 |
| All list endpoints require authentication | `authenticate` on list routes | Feature 2 FR-001 |
| List ownership is immutable; `userId` set only from `req.user.id` on create | List controller create | Feature 2 FR-002 / FR-004 |
| Every list read/update/delete scopes by `userId: req.user.id` | `getAccessibleListOrNull` + `findAll` where | Feature 2 FR-003 |
| List names trimmed; empty rejected; max 100 chars | Controller validation + client rules | Feature 2 FR-005 |
| Lists ordered alphabetically by name | `order: [["name", "ASC"]]` | Feature 2 FR-006 |
| Cross-user list access → `404` `"List with id=<id> not found."` | `getAccessibleListOrNull` | Feature 2 US-2.5 |
| Empty lists view shows **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 AC |
| Row actions: **Edit list** / **Delete list** (icon-only, `size="small"`) | `Dashboard.vue` | Feature 2 Screen Requirements |
