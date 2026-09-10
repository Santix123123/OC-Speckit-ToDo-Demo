<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const dialogError = ref("");

const createDialog = ref(false);
const renameDialog = ref(false);
const deleteDialog = ref(false);
const itemsDialog = ref(false);
const addItemDialog = ref(false);
const editItemDialog = ref(false);
const deleteItemDialog = ref(false);
const saving = ref(false);

const newListName = ref("");
const renameListName = ref("");
const selectedList = ref(null);

const todos = ref([]);
const todosLoading = ref(false);
const todosError = ref("");
const newTodoTitle = ref("");
const editTodoTitle = ref("");
const selectedTodo = ref(null);

const createFormRef = ref(null);
const renameFormRef = ref(null);
const addItemFormRef = ref(null);
const editItemFormRef = ref(null);

const nameRules = [(v) => !!v?.trim() || "List name is required."];
const titleRules = [(v) => !!v?.trim() || "Todo title is required."];

async function loadLists() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await listServices.getAll();
    lists.value = res.data;
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || "Unable to load lists.";
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  newListName.value = "";
  dialogError.value = "";
  createDialog.value = true;
}

function openRenameDialog(list) {
  selectedList.value = list;
  renameListName.value = list.name;
  dialogError.value = "";
  renameDialog.value = true;
}

function openDeleteDialog(list) {
  selectedList.value = list;
  dialogError.value = "";
  deleteDialog.value = true;
}

async function openItemsDialog(list) {
  selectedList.value = list;
  todos.value = [];
  todosError.value = "";
  itemsDialog.value = true;
  todosLoading.value = true;
  try {
    const res = await todoServices.getAllForList(list.id);
    todos.value = res.data;
  } catch (err) {
    todosError.value =
      err.response?.data?.message || "Unable to load todos.";
  } finally {
    todosLoading.value = false;
  }
}

function openAddItemDialog() {
  newTodoTitle.value = "";
  dialogError.value = "";
  addItemDialog.value = true;
}

function openEditItemDialog(todo) {
  selectedTodo.value = todo;
  editTodoTitle.value = todo.title;
  dialogError.value = "";
  editItemDialog.value = true;
}

function openDeleteItemDialog(todo) {
  selectedTodo.value = todo;
  dialogError.value = "";
  deleteItemDialog.value = true;
}

async function confirmCreate() {
  dialogError.value = "";
  const { valid } = await createFormRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    const res = await listServices.create({ name: newListName.value.trim() });
    lists.value = [...lists.value, res.data].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    createDialog.value = false;
    newListName.value = "";
  } catch (err) {
    dialogError.value =
      err.response?.data?.message || "Unable to create list.";
  } finally {
    saving.value = false;
  }
}

async function confirmRename() {
  dialogError.value = "";
  const { valid } = await renameFormRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    const res = await listServices.update(selectedList.value.id, {
      name: renameListName.value.trim(),
    });
    lists.value = lists.value
      .map((list) => (list.id === res.data.id ? res.data : list))
      .sort((a, b) => a.name.localeCompare(b.name));
    renameDialog.value = false;
    selectedList.value = null;
  } catch (err) {
    dialogError.value =
      err.response?.data?.message || "Unable to rename list.";
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  dialogError.value = "";
  saving.value = true;
  try {
    await listServices.delete(selectedList.value.id);
    lists.value = lists.value.filter(
      (list) => list.id !== selectedList.value.id
    );
    deleteDialog.value = false;
    selectedList.value = null;
  } catch (err) {
    dialogError.value =
      err.response?.data?.message || "Unable to delete list.";
  } finally {
    saving.value = false;
  }
}

async function confirmAddItem() {
  dialogError.value = "";
  const { valid } = await addItemFormRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    const res = await todoServices.create(selectedList.value.id, {
      title: newTodoTitle.value.trim(),
    });
    todos.value = [...todos.value, res.data];
    addItemDialog.value = false;
    newTodoTitle.value = "";
  } catch (err) {
    dialogError.value =
      err.response?.data?.message || "Unable to create todo.";
  } finally {
    saving.value = false;
  }
}

async function confirmEditItem() {
  dialogError.value = "";
  const { valid } = await editItemFormRef.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    const res = await todoServices.update(selectedTodo.value.id, {
      title: editTodoTitle.value.trim(),
    });
    todos.value = todos.value.map((todo) =>
      todo.id === res.data.id ? res.data : todo
    );
    editItemDialog.value = false;
    selectedTodo.value = null;
  } catch (err) {
    dialogError.value =
      err.response?.data?.message || "Unable to update todo.";
  } finally {
    saving.value = false;
  }
}

async function confirmDeleteItem() {
  dialogError.value = "";
  saving.value = true;
  try {
    await todoServices.delete(selectedTodo.value.id);
    todos.value = todos.value.filter(
      (todo) => todo.id !== selectedTodo.value.id
    );
    deleteItemDialog.value = false;
    selectedTodo.value = null;
  } catch (err) {
    dialogError.value =
      err.response?.data?.message || "Unable to delete todo.";
  } finally {
    saving.value = false;
  }
}

async function toggleCompleted(todo) {
  todosError.value = "";
  try {
    const res = await todoServices.update(todo.id, {
      completed: !todo.completed,
    });
    todos.value = todos.value.map((item) =>
      item.id === res.data.id ? res.data : item
    );
  } catch (err) {
    todosError.value =
      err.response?.data?.message || "Unable to update todo.";
  }
}

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">My Lists</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          @click="openCreateDialog"
        >
          + New List
        </v-btn>
      </v-col>
    </v-row>

    <v-alert
      v-if="errorMessage"
      type="error"
      density="compact"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <div v-if="loading" class="py-6">
      <v-progress-linear indeterminate color="primary" />
    </div>

    <p
      v-else-if="lists.length === 0"
      class="text-body-1 text-medium-emphasis"
    >
      No lists yet. Create your first list.
    </p>

    <v-list v-else lines="one" class="bg-transparent">
      <v-list-item
        v-for="list in lists"
        :key="list.id"
        :title="list.name"
        class="px-0"
      >
        <template #append>
          <v-btn
            icon="mdi-format-list-checks"
            size="small"
            variant="text"
            :aria-label="`View items for ${list.name}`"
            @click="openItemsDialog(list)"
          />
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            aria-label="Edit list"
            @click="openRenameDialog(list)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            aria-label="Delete list"
            @click="openDeleteDialog(list)"
          />
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="createDialog" max-width="480" attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title>New List</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="dialogError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ dialogError }}
          </v-alert>
          <v-form ref="createFormRef" @submit.prevent="confirmCreate">
            <v-text-field
              v-model="newListName"
              label="List name"
              density="comfortable"
              rounded="lg"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="createDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="confirmCreate"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialog" max-width="480" attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title>Rename List</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="dialogError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ dialogError }}
          </v-alert>
          <v-form ref="renameFormRef" @submit.prevent="confirmRename">
            <v-text-field
              v-model="renameListName"
              label="List name"
              density="comfortable"
              rounded="lg"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="renameDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="confirmRename"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480" attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title>Delete List</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="dialogError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ dialogError }}
          </v-alert>
          <p class="text-body-1">
            Delete
            <strong>{{ selectedList?.name }}</strong>?
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="itemsDialog" max-width="640" attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title>{{ selectedList?.name }} — Items</v-card-title>
          <template #append>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="openAddItemDialog"
            >
              + Add Item
            </v-btn>
          </template>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="todosError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ todosError }}
          </v-alert>

          <div v-if="todosLoading" class="py-4">
            <v-progress-linear indeterminate color="primary" />
          </div>

          <p
            v-else-if="todos.length === 0"
            class="text-body-1 text-medium-emphasis"
          >
            No todos in this list yet.
          </p>

          <v-list v-else lines="one" class="bg-transparent">
            <v-list-item v-for="todo in todos" :key="todo.id" class="px-0">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  hide-details
                  density="compact"
                  :aria-label="`Toggle ${todo.title}`"
                  @update:model-value="toggleCompleted(todo)"
                />
              </template>
              <v-list-item-title
                :class="{
                  'text-decoration-line-through text-medium-emphasis':
                    todo.completed,
                }"
              >
                {{ todo.title }}
              </v-list-item-title>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit todo"
                  @click="openEditItemDialog(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  aria-label="Delete todo"
                  @click="openDeleteItemDialog(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="itemsDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addItemDialog" max-width="480" attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title>Add Item</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="dialogError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ dialogError }}
          </v-alert>
          <v-form ref="addItemFormRef" @submit.prevent="confirmAddItem">
            <v-text-field
              v-model="newTodoTitle"
              label="Todo title"
              density="comfortable"
              rounded="lg"
              :rules="titleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="secondary"
            variant="text"
            @click="addItemDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="confirmAddItem"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editItemDialog" max-width="480" attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title>Edit Item</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="dialogError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ dialogError }}
          </v-alert>
          <v-form ref="editItemFormRef" @submit.prevent="confirmEditItem">
            <v-text-field
              v-model="editTodoTitle"
              label="Todo title"
              density="comfortable"
              rounded="lg"
              :rules="titleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="secondary"
            variant="text"
            @click="editItemDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="confirmEditItem"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteItemDialog" max-width="480" attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title>Delete Item</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="dialogError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ dialogError }}
          </v-alert>
          <p class="text-body-1">
            Delete
            <strong>{{ selectedTodo?.title }}</strong>?
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="secondary"
            variant="text"
            @click="deleteItemDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="confirmDeleteItem"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
