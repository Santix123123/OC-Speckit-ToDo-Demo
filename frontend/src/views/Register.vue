<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMessage = ref("");
const formValid = ref(false);
const formRef = ref(null);

const fNameRules = [(v) => !!v?.trim() || "First name is required."];
const lNameRules = [(v) => !!v?.trim() || "Last name is required."];
const usernameRules = [(v) => !!v?.trim() || "Username is required."];
const passwordRules = [
  (v) => !!v?.trim() || "Password is required.",
  (v) =>
    !v || v.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = computed(() => [
  (v) => !!v?.trim() || "Confirm password is required.",
  (v) => v === password.value || "Passwords do not match.",
]);

async function onSubmit() {
  errorMessage.value = "";

  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await authServices.registerUser({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    await router.push({ name: "home" });
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || "Unable to create account.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height py-10" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <h1 class="text-h4 mb-6 text-center">Create account</h1>

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
            autocomplete="email"
            density="comfortable"
            rounded="lg"
            :rules="emailRules"
            class="mb-2"
          />
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
            autocomplete="new-password"
            density="comfortable"
            rounded="lg"
            :rules="passwordRules"
            class="mb-2"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            autocomplete="new-password"
            density="comfortable"
            rounded="lg"
            :rules="confirmPasswordRules"
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
            Create account
          </v-btn>
        </v-form>

        <p class="text-body-2 text-center mt-6">
          Already have an account?
          <router-link :to="{ name: 'login' }">Sign in</router-link>
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>
