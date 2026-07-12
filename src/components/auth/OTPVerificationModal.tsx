import { getTypography } from '../../constants/typography';
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import OTPInput from '../ui/OTPInput';
import PrimaryButton from '../ui/PrimaryButton';
import { useTheme } from '../../hooks/useTheme';
import { resendOTP } from '../../services/auth';
import AuthModalWrapper from './AuthModalWrapper';

type OTPVerificationModalProps = {
  visible: boolean;
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onClose?: () => void;
};

export default function OTPVerificationModal({
  visible,
  email,
  onVerify,
  onClose,
}: OTPVerificationModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Timer for resend button
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (visible && !isVerifying) {
      setOtp('');
    }
  }, [visible, isVerifying]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Thông báo', 'Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otp);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xác thực OTP thất bại.';
      Alert.alert('Lỗi', message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || isResending) return;

    if (resendCount >= 3) {
      Alert.alert('Thông báo', 'Số lần gửi lại đã hết. Vui lòng liên hệ hỗ trợ.');
      return;
    }

    setIsResending(true);
    try {
      await resendOTP(email);
      setOtp('');
      setResendTimer(60);
      setResendCount((prev) => prev + 1);
      Alert.alert('Thành công', `Mã OTP mới đã gửi đến ${email}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gửi lại OTP thất bại.';
      Alert.alert('Lỗi', message);
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    setOtp('');
    setIsResending(false);
    setResendTimer(0);
    setResendCount(0);
    onClose?.();
  };

  return (
    <AuthModalWrapper
      visible={visible}
      title="Xác thực OTP"
      subtitle={
        <Text style={styles.subtitle}>
          Vui lòng nhập mã gồm 6 chữ số đã được gửi đến{'\n'}
          <Text style={{ color: COLORS.onSurface, fontWeight: '500' }}>
            {email}
          </Text>
        </Text>
      }
      onClose={handleClose}
    >
      <View style={styles.form}>
        {/* OTP Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nhập mã OTP</Text>
          <OTPInput
            value={otp}
            onChangeText={setOtp}
            disabled={isVerifying || isResending}
            style={styles.otpInputMargin}
          />
        </View>

        {/* Verify Button */}
        <PrimaryButton
          label="Tiếp tục"
          loading={isVerifying || otp.length !== 6 || isResending}
          onPress={handleVerify}
          style={styles.verifyButton}
        />

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>
            {resendTimer > 0
              ? `Gửi lại mã sau ${resendTimer}s`
              : 'Không nhận được mã?'}
          </Text>
          {resendTimer === 0 && (
            <Pressable
              onPress={handleResendOTP}
              disabled={resendCount >= 3 || isResending}
            >
              <Text
                style={[
                  styles.resendLink,
                  (resendCount >= 3 || isResending) && styles.resendLinkDisabled,
                ]}
              >
                {isResending ? 'Đang gửi...' : 'Gửi lại'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Resend Count Info */}
        {resendCount > 0 && (
          <Text style={styles.countInfo}>
            Lần gửi lại: {resendCount}/3
          </Text>
        )}
      </View>
    </AuthModalWrapper>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  form: {
    width: '100%',
  },
  subtitle: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    ...typography.bodyMd,
    color: COLORS.onSurface,
    marginBottom: 12,
    fontWeight: '600',
  },
  otpInputMargin: {
    marginBottom: 16,
  },
  verifyButton: {
    marginBottom: 16,
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  resendText: {
    ...typography.labelCaps,
    color: COLORS.onSurfaceVariant,
  },
  resendLink: {
    ...typography.labelCaps,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: COLORS.outlineVariant,
  },
  countInfo: {
    ...typography.labelCaps,
    color: COLORS.outline,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeButton: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    marginHorizontal: -24,
    marginBottom: -32,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  closeText: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
});
