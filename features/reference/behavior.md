# Behavior & Rules Reference

**Living snapshot** of product rules currently in force after Features 1–3.

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
| Row actions: **Items** / **Edit list** / **Delete list** (icon-only, `size="small"`) | `Dashboard.vue` | Features 2–3 Screen Requirements |
| All todo endpoints require authentication | `authenticate` on todo routes | Feature 3 FR-001 |
| Todo belongs to one list and one user for its lifetime | Todo model + create path | Feature 3 FR-002 |
| Every todo read/update/delete scopes by `userId: req.user.id` | `getAccessibleTodoOrNull` | Feature 3 FR-003 |
| Creating a todo requires owned parent list; else `404` | `getAccessibleListOrNull` before create | Feature 3 FR-004 |
| On create, `userId` / `listId` from server context only | Todo controller create | Feature 3 FR-005 |
| Todo titles trimmed; empty rejected; max 255 chars | Controller + client rules | Feature 3 FR-006 |
| New todos default to `completed: false` | Todo create | Feature 3 FR-007 |
| Deleting a list deletes its todos | List controller destroys todos then list | Feature 3 FR-008 |
| Todos ordered incomplete first, then `createdAt` ascending | `order: [["completed","ASC"],["createdAt","ASC"]]` | Feature 3 FR-009 |
| List-items dialog opened from row **Items** icon; add/edit/delete via nested dialogs | `Dashboard.vue` | Feature 3 FR-010 |
| Cross-user todo access → `404` `"Todo with id=<id> not found."` | `getAccessibleTodoOrNull` | Feature 3 US-3.5 |
| Empty items dialog shows **"No todos in this list yet."** | `Dashboard.vue` | Feature 3 AC |
| Completed todos show struck-through / muted title | `Dashboard.vue` | Feature 3 Screen Requirements |
