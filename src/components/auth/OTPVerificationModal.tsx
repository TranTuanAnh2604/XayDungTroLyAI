import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OTPInput from '../ui/OTPInput';
import PrimaryButton from '../ui/PrimaryButton';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import { resendOTP } from '../../services/auth';
import IosGlassView from '../ui/IosGlassView';

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
  const insets = useSafeAreaInsets();
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
    console.log('🔐 handleVerify: Bắt đầu xác thực OTP', { otp });
    
    try {
      await onVerify(otp);
      console.log('✅ handleVerify: Xác thực thành công!');
    } catch (error) {
      console.log('❌ handleVerify: Lỗi xác thực', error);
      const message = error instanceof Error ? error.message : 'Xác thực OTP thất bại.';
      Alert.alert('Lỗi', message);
    } finally {
      setIsVerifying(false);
      console.log('🛑 handleVerify: Dừng loading');
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

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} />
        
        <View style={styles.centerContent} pointerEvents="box-none">

        <IosGlassView
          style={[
            styles.modalContent,
            {
              marginBottom: insets.bottom,
              marginTop: insets.top,
            },
            ]}
          >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Xác thực OTP</Text>
            <Text style={styles.subtitle}>
              Mã OTP đã được gửi đến {maskedEmail}
            </Text>
          </View>

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

          {/* Close Button */}
          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, (isVerifying || isResending) && styles.closeButtonDisabled]}
            disabled={isVerifying || isResending}
          >
            <Text style={styles.closeText}>Đóng</Text>
          </Pressable>
        </IosGlassView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginHorizontal: 'auto',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    zIndex: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    ...typography.headlineMd,
    color: COLORS.onSurface,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
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
