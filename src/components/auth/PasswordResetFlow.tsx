import React from 'react';
import { View, Alert } from 'react-native';
import ForgotPasswordModal from './ForgotPasswordModal';
import OTPVerificationModal from './OTPVerificationModal';
import ResetPasswordModal from './ResetPasswordModal';
import PrimaryButton from '../ui/PrimaryButton';
import { forgotPassword, verifyOTP, resetPassword } from '../../services/auth';

export type AuthStep = 'forgot' | 'otp' | 'reset' | 'none';

type Props = {
  step: AuthStep;
  email: string;
  onClose: () => void;
  onChangeStep: (step: AuthStep, email?: string) => void;
};

export default function AuthModal({
  step,
  email,
  onClose,
  onChangeStep,
}: Props) {
  const isVisible = step !== 'none';

  const handleForgot = async (emailInput: string) => {
    try {
      await forgotPassword(emailInput);
      onChangeStep('otp', emailInput);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi OTP');
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      await verifyOTP(email, otp);
      onChangeStep('reset', email);
    } catch (e) {
      Alert.alert('Lỗi', 'OTP không hợp lệ');
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    try {
      await resetPassword({
        email,
        otp: '',
        newPassword,
      });

      Alert.alert('Thành công', 'Mật khẩu đã được cập nhật');

      onChangeStep('none');
      onClose();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đổi mật khẩu');
    }
  };

  return (
    <View>
      <PrimaryButton
        label="Quên mật khẩu?"
        onPress={() => onChangeStep('forgot')}
      />

      <ForgotPasswordModal
        visible={step === 'forgot'}
        onClose={onClose}
        onSubmit={handleForgot}
      />

      <OTPVerificationModal
        visible={step === 'otp'}
        email={email}
        onClose={onClose}
        onVerify={handleVerifyOtp}
      />

      <ResetPasswordModal
        visible={step === 'reset'}
        email={email}
        onClose={onClose}
        onSubmit={handleResetPassword}
      />
    </View>
  );
}
