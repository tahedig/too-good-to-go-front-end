import type {
  VerifyOtpPayload,
  LoginResponse,
} from "../types/authTypes";

import { postData } from "./services";
import { tokenStorage } from "./tokenStorage";

export const verifyOtpService = async (
  payload: VerifyOtpPayload
): Promise<LoginResponse> => {

  const response = await postData<LoginResponse>({
    endPoint: "/auth/otp/verify",
    data: payload,
  });
  if (!response.verified || !response.access_token) {
    throw new Error("OTP verification failed");
  }

  // Save the raw access token
  tokenStorage.setToken(response.access_token);

  return response;
};

export const logoutService = (): void => {
  tokenStorage.clearToken();
};