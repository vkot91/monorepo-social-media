import { LoginInput, RegisterInput } from "@social/contracts";
import { clientRequest } from "../requests/client-request";

export const authClientApi = {
  login(input: LoginInput) {
    return clientRequest("/api/auth/login", "POST", {
      body: input,
    });
  },

  logout() {
    return clientRequest("/api/auth/logout", "POST", {});
  },

  register(input: RegisterInput) {
    return clientRequest("/api/auth/register", "POST", {
      body: input,
    });
  },
};
