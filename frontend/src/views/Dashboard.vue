<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const dialogError = ref("");

const createDialog = ref(false);
const renameDialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);

const newListName = ref("");
const renameListName = ref("");
const selectedList = ref(null);

const createFormRef = ref(null);
const renameFormRef = ref(null);

const nameRules = [(v) => !!v?.trim() || "List name is required."];

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
  </v-container>
</template>
