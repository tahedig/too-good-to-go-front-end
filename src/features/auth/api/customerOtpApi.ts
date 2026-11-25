import { postData } from "../../../services/services"

interface RequestOtpResponse {
  message: string
  expires_in_seconds: number
  debug_code?: string
}

export const customerOtpApi = {
  requestOtp: async (phone: string): Promise<RequestOtpResponse> => {
    const response = await postData<RequestOtpResponse>({
      endPoint: "/auth/otp/request",
      data: {
        phone,
      },
    })

    if (response.debug_code) {
      console.info("OTP debug code:", response.debug_code)
    }

    return response
  },
}
