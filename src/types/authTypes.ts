// export interface LoginPayload {
// 	email: string;
// 	username: string | null;
// 	password: string;
// }

// export interface LoginResponse {
// 	user: {
// 		id: number;
// 		name: string;
// 		email: string;
// 		username: string;
// 	};
// }

export interface VerifyOtpPayload {
  phone: string
  code: string
}

export interface AuthUser {
  id: string
  phone: string
  role: string
}

export interface LoginResponse {
  verified: boolean
  phone: string
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}
