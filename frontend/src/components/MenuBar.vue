<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const loading = ref(false);

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }
  const first = user.value.fName || "";
  const last = user.value.lName || "";
  return `${first} ${last}`.trim() || user.value.username || "";
});

function refreshUser() {
  user.value = Utils.getStore("user");
}

async function onSignOut() {
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
    <span v-if="displayName" class="text-body-2 me-4">{{ displayName }}</span>
    <v-btn
      color="secondary"
      variant="text"
      :loading="loading"
      @click="onSignOut"
    >
      Sign out
    </v-btn>
  </v-app-bar>
</template>
