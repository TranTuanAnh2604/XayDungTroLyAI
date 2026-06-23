import { login as loginApi, verifyOTP as verifyOtpApi } from './auth';
import type { AuthResponse } from './auth';

export async function completeRegistrationWithOtp(
  email: string,
  password: string,
  otp: string,
): Promise<AuthResponse> {
  await verifyOtpApi(email, otp);
  return await loginApi(email, password);
}
