# OTP Verification Implementation

## Overview
OTP (One-Time Password) verification has been integrated into the registration flow to verify email addresses after successful account creation.

## File Structure

### Components
- **`src/components/ui/OTPInput.tsx`** - Reusable OTP input component with 6 digit boxes
  - Displays 6 input boxes for OTP digits
  - Only accepts numeric input
  - Visually indicates when all digits are filled
  - Keyboard automatically opens on first focus

- **`src/components/auth/OTPVerificationModal.tsx`** - Modal popup for OTP verification
  - Shows OTP input field
  - Displays email (masked for privacy)
  - Verify button to submit OTP
  - Resend OTP functionality with 60-second timer
  - Maximum 3 resend attempts
  - Resend count indicator
  - Close button to dismiss modal

### Services
- **`src/services/auth.ts`** - Added two new functions:
  - `verifyOTP(email: string, otp: string)` - Submits OTP for verification
  - `resendOTP(email: string)` - Requests a new OTP to be sent

### Screens
- **`src/screens/auth/RegisterScreen.tsx`** - Updated to include OTP flow
  - After successful registration, shows OTP modal
  - User enters OTP code
  - On successful verification, navigates to main app
  - On close, returns to registration form

## User Flow

1. User fills in registration form (name, email, password)
2. User clicks "Đăng ký" (Register) button
3. Registration is processed on backend
4. OTP modal appears with email address
5. User checks email for OTP code
6. User enters 6-digit OTP in the modal
7. User clicks "Xác thực" (Verify) button
8. If successful → navigates to main app
9. If failed → shows error message, user can resend or close

## Features

### OTPInput Component
- 6 input boxes with visual feedback
- Auto-focuses on mount
- Only accepts numeric characters
- Prevents invalid input
- Styled with theme colors

### OTPVerificationModal Component
- Clean, centered modal design
- Email masking (e.g., "us***@gmail.com")
- Countdown timer for resend functionality
- Auto-disabled resend button during countdown
- Resend limit (3 attempts)
- Loading state feedback
- Keyboard-avoiding behavior for iOS/Android

## Styling

All components use the existing theme system:
- `COLORS` from `src/constants/theme.ts`
- `typography` from `src/constants/typography.ts`
- `SPACING` from `src/constants/spacing.ts`

## API Integration

The following endpoints are expected:
- `POST /api/Auth/verify-otp` - Verifies OTP code
- `POST /api/Auth/resend-otp` - Resends OTP code

Both endpoints should return proper error messages if verification fails.

## Future Enhancements

- SMS OTP support
- Biometric verification after OTP
- OTP expiration time (typically 10-15 minutes)
- SMS verification as an alternative
- Rate limiting on resend attempts
