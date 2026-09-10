<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user"));
const loading = ref(false);

const welcomeName = computed(() => user.value?.fName || "there");

async function onSignOut() {
  loading.value = true;
  try {
    await authServices.logoutUser();
  } catch {
    // Clear local session even if the server call fails
  } finally {
    Utils.removeItem("user");
    loading.value = false;
    await router.push({ name: "login" });
  }
}
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-2">Welcome, {{ welcomeName }}</h1>
    <p class="text-body-1 mb-6">
      You are signed in. Todo lists arrive in a later feature.
    </p>

    <v-btn
      color="secondary"
      variant="outlined"
      :loading="loading"
      @click="onSignOut"
    >
      Sign out
    </v-btn>
  </v-container>
</template>
