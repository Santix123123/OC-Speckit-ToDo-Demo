# Data Model Reference

**Status:** Features 1–4 — `users`, `sessions`, `lists`, and `todos` tables.

Update this file when a feature that defines schema merges to `dev`.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required; editable via `PUT /todo/users/:id` |
| `lName` | STRING | Required; editable via `PUT /todo/users/:id` |
| `email` | STRING | Required, unique; editable via `PUT /todo/users/:id` |
| `username` | STRING(100) | Required, unique; stored lowercase; editable via `PUT /todo/users/:id` |
| `password` | STRING(255) | Required; bcrypt hash only (`defaultScope` excludes from queries); optional on profile update |
| `role` | STRING(20) | Default `worker`; read-only on profile API |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; cleared to `""` on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required; references `users.id` |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; trimmed; max 100 chars |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; deleted when parent list is deleted |
| `title` | STRING(255) | Required; trimmed; max 255 chars |
| `completed` | BOOLEAN | Default `false` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

- `User hasMany Session` (`as: "sessions"`, `foreignKey: "userId"`)
- `Session belongsTo User` (`as: "user"`, `foreignKey: "userId"`)
- `User hasMany List` (`as: "lists"`, `foreignKey: "userId"`)
- `List belongsTo User` (`as: "user"`, `foreignKey: "userId"`)
- `User hasMany Todo` (`as: "todos"`, `foreignKey: "userId"`)
- `Todo belongsTo User` (`as: "user"`, `foreignKey: "userId"`)
- `List hasMany Todo` (`as: "todos"`, `foreignKey: "listId"`, `onDelete: CASCADE`)
- `Todo belongsTo List` (`as: "list"`, `foreignKey: "listId"`)
