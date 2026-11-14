import { postData } from "../../../services/services"

interface RequestOtpResponse {
  request_id: string;
  retry_after?: number;
  [key: string]: unknown;
}

export const customerOtpApi = {
  requestOtp: async (phone: string): Promise<RequestOtpResponse> => {
    const response = await postData<RequestOtpResponse>({
      endPoint: "/auth/otp/request",
      data: {
        phone: phone,
      },
    });

    console.log("OTP request response:", response);

    return response;
  },
};