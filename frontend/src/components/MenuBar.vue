<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const menuOpen = ref(false);
const editDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const formRef = ref(null);

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const fullName = computed(() => {
  if (!user.value) {
    return "";
  }
  return `${user.value.fName || ""} ${user.value.lName || ""}`.trim();
});

const fNameRules = [(v) => !!v?.trim() || "First name is required."];
const lNameRules = [(v) => !!v?.trim() || "Last name is required."];
const usernameRules = [(v) => !!v?.trim() || "Username is required."];
const passwordRules = [
  (v) => !v || v.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = computed(() => [
  (v) => v === password.value || "Passwords do not match.",
]);

function refreshUser() {
  user.value = Utils.getStore("user");
}

function fillFormFromUser() {
  fName.value = user.value?.fName || "";
  lName.value = user.value?.lName || "";
  email.value = user.value?.email || "";
  username.value = user.value?.username || "";
  password.value = "";
  confirmPassword.value = "";
  errorMessage.value = "";
}

function openEditDialog() {
  fillFormFromUser();
  editDialog.value = true;
}

async function onCancelEdit() {
  editDialog.value = false;
  fillFormFromUser();
}

async function onSaveProfile() {
  errorMessage.value = "";
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }

  const userId = user.value?.userId;
  saving.value = true;
  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
    };
    if (password.value) {
      payload.password = password.value;
    }

    const res = await userServices.updateUser(userId, payload);
    const current = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...current,
      userId: res.data.id,
      username: res.data.username,
      email: res.data.email,
      fName: res.data.fName,
      lName: res.data.lName,
      role: res.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    refreshUser();
    editDialog.value = false;
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || "Unable to update profile.";
  } finally {
    saving.value = false;
  }
}

async function onLogOut() {
  loading.value = true;
  try {
    await authServices.logoutUser();
  } catch {
    // Clear local session even if the server call fails
  } finally {
    Utils.removeItem("user");
    user.value = null;
    loading.value = false;
    await router.push({ name: "login" });
  }
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  refreshUser();
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <v-app-bar color="surface" elevation="1" density="comfortable">
    <v-app-bar-title class="text-primary font-weight-bold">
      Todo Speckit
    </v-app-bar-title>
    <v-spacer />
    <v-menu v-model="menuOpen" attach location="bottom end">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-account-circle"
          v-bind="props"
          aria-label="Open profile menu"
        />
      </template>
      <v-card min-width="280" rounded="lg">
        <v-list>
          <v-list-item :title="fullName">
            <v-list-item-subtitle>{{ user?.username }}</v-list-item-subtitle>
            <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openEditDialog"
          >
            Edit Profile
          </v-btn>
          <v-spacer />
          <v-btn
            color="secondary"
            variant="text"
            :loading="loading"
            @click="onLogOut"
          >
            Log out
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialog" max-width="480" attach>
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Edit Profile</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>
        <v-form ref="formRef" @submit.prevent="onSaveProfile">
          <v-text-field
            v-model="fName"
            label="First name"
            density="comfortable"
            rounded="lg"
            :rules="fNameRules"
            class="mb-2"
          />
          <v-text-field
            v-model="lName"
            label="Last name"
            density="comfortable"
            rounded="lg"
            :rules="lNameRules"
            class="mb-2"
          />
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            density="comfortable"
            rounded="lg"
            :rules="emailRules"
            class="mb-2"
          />
          <v-text-field
            v-model="username"
            label="Username"
            density="comfortable"
            rounded="lg"
            :rules="usernameRules"
            class="mb-2"
          />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            density="comfortable"
            rounded="lg"
            :rules="passwordRules"
            class="mb-2"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            density="comfortable"
            rounded="lg"
            :rules="confirmPasswordRules"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="onCancelEdit">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="saving"
          @click="onSaveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
