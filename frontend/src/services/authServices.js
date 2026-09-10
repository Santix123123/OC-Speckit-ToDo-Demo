import apiClient from "./services.js";

const authServices = {
  registerUser(payload) {
    return apiClient.post("register", payload);
  },

  loginUser(credentials) {
    return apiClient.post("login", credentials);
  },

  logoutUser() {
    return apiClient.post("logout");
  },
};

export default authServices;
