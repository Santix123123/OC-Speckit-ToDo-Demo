<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");
const formValid = ref(false);
const formRef = ref(null);

const usernameRules = [(v) => !!v?.trim() || "Username is required."];
const passwordRules = [(v) => !!v?.trim() || "Password is required."];

async function onSubmit() {
  errorMessage.value = "";

  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await authServices.loginUser({
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    await router.push({ name: "home" });
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || "Unable to sign in.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <h1 class="text-h4 mb-6 text-center">Sign in</h1>

        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form ref="formRef" v-model="formValid" @submit.prevent="onSubmit">
          <v-text-field
            v-model="username"
            label="Username"
            autocomplete="username"
            density="comfortable"
            rounded="lg"
            :rules="usernameRules"
            class="mb-2"
          />
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            autocomplete="current-password"
            density="comfortable"
            rounded="lg"
            :rules="passwordRules"
            class="mb-4"
          />
          <v-btn
            type="submit"
            color="primary"
            variant="elevated"
            class="oc-cta"
            block
            :loading="loading"
          >
            Sign in
          </v-btn>
        </v-form>

        <p class="text-body-2 text-center mt-6">
          Need an account?
          <router-link :to="{ name: 'register' }">Create account</router-link>
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>
