import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PasswordInput from '../ui/PasswordInput';
import PrimaryButton from '../ui/PrimaryButton';
import { RADIUS } from '../../constants/theme';
import { getTypography } from '../../constants/typography';
import IosGlassView from '../ui/IosGlassView';
import { useTheme } from '../../hooks/useTheme';
import { changePassword } from '../../services/auth';

type ChangePasswordModalProps = {
  visible: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
};

export default function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  const insets = useSafeAreaInsets();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form only when modal opens and loading is done
  useEffect(() => {
    if (visible && !isLoading) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [visible, isLoading]);

  const handleSubmit = async () => {
    if (!oldPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng xác nhận mật khẩu mới');
      return;
    }

    // Password validation (at least 8 characters)
    if (newPassword.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp. Vui lòng thử lại');
      return;
    }

    try {
      setIsLoading(true);
      const res = await changePassword(oldPassword, newPassword, confirmPassword);
      if (res.success) {
        Alert.alert('Thành công', res.message || 'Mật khẩu đã được thay đổi');
        onSuccess?.();
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể đổi mật khẩu');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  const passwordStrength = getPasswordStrength(newPassword, COLORS);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
        <IosGlassView
          style={[
            styles.modalContent,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              hitSlop={8}
            >
              <MaterialIcons
                name="close"
                size={24}
                color={COLORS.onSurface}
              />
            </Pressable>
          </View>

          {/* Title */}
          <Text style={styles.title}>Đổi mật khẩu</Text>
          <Text style={styles.subtitle}>
            Vui lòng nhập mật khẩu cũ và mật khẩu mới của bạn
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Old Password Input */}
            <PasswordInput
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu cũ"
              value={oldPassword}
              onChangeText={setOldPassword}
              editable={!isLoading}
              testID="change-password-old"
            />

            {/* New Password Input */}
            <PasswordInput
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!isLoading}
              testID="change-password-new"
            />

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${passwordStrength.percentage}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthText,
                    { color: passwordStrength.color },
                  ]}
                >
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            {/* Confirm Password Input */}
            <PasswordInput
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
              testID="change-password-confirm"
            />

            {/* Match Indicator */}
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <View style={styles.mismatchContainer}>
                <MaterialIcons
                  name="error-outline"
                  size={16}
                  color={COLORS.error}
                />
                <Text style={styles.mismatchText}>
                  Mật khẩu không khớp
                </Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <PrimaryButton
            label="Lưu thay đổi"
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitButton}
          />
        </IosGlassView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Calculate password strength
 */
function getPasswordStrength(password: string, COLORS: any): {
  label: string;
  percentage: number;
  color: string;
} {
  if (!password) {
    return { label: '', percentage: 0, color: COLORS.outline };
  }

  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 2) {
    return { label: 'Yếu', percentage: 33, color: COLORS.error };
  } else if (strength <= 4) {
    return { label: 'Vừa phải', percentage: 66, color: '#f59e0b' };
  } else {
    return { label: 'Mạnh', percentage: 100, color: COLORS.emerald };
  }
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
    borderRadius: RADIUS.md,
  },
  closeButtonPressed: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  title: {
    ...typography.displayLgMobile,
    fontWeight: '700',
    marginBottom: 8,
    color: COLORS.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    marginBottom: 20,
    gap: 16,
  },
  strengthContainer: {
    marginVertical: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthFill: {
    height: '100%',
  },
  strengthText: {
    ...typography.bodyLg,
    fontWeight: '500',
  },
  mismatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  mismatchText: {
    ...typography.bodyLg,
    color: COLORS.error,
    fontWeight: '500',
  },
  submitButton: {
    marginBottom: 20,
  },
});
