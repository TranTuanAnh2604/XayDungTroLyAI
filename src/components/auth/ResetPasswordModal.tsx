import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Alert,
  View,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PasswordInput from '../ui/PasswordInput';
import PrimaryButton from '../ui/PrimaryButton';
import { RADIUS } from '../../constants/theme';
import { getTypography } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';
import { getPasswordStrength } from '../../utils/password';
import AuthModalWrapper from './AuthModalWrapper';

type ResetPasswordModalProps = {
  visible: boolean;
  email: string;
  onClose?: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
};

export default function ResetPasswordModal({
  visible,
  email,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form only when modal opens and loading is done
  useEffect(() => {
    if (visible && !isLoading) {
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [visible, isLoading]);

  const handleSubmit = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng xác nhận mật khẩu');
      return;
    }

    // Password validation (at least 8 characters)
    if (newPassword.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp. Vui lòng thử lại');
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(newPassword);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
      Alert.alert('Lỗi', errorMessage);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  const passwordStrength = getPasswordStrength(newPassword, COLORS);

  return (
    <AuthModalWrapper
      visible={visible}
      title="Đặt lại mật khẩu"
      subtitle={`Tạo mật khẩu mới cho tài khoản ${email}`}
      onClose={handleClose}
    >
      <View style={styles.form}>
            {/* New Password Input */}
            <PasswordInput
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!isLoading}
              testID="reset-password-new"
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
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
              testID="reset-password-confirm"
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
            label="Cập nhật mật khẩu"
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitButton}
          />

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
            <View style={styles.requirement}>
              <MaterialIcons
                name={newPassword.length >= 8 ? 'check-circle' : 'radio-button-unchecked'}
                size={16}
                color={newPassword.length >= 8 ? COLORS.emerald : COLORS.outline}
              />
              <Text style={styles.requirementText}>
                Ít nhất 8 ký tự
              </Text>
            </View>
            <View style={styles.requirement}>
              <MaterialIcons
                name={newPassword === confirmPassword && newPassword.length > 0 ? 'check-circle' : 'radio-button-unchecked'}
                size={16}
                color={newPassword === confirmPassword && newPassword.length > 0 ? COLORS.emerald : COLORS.outline}
              />
              <Text style={styles.requirementText}>
                Mật khẩu khớp
              </Text>
            </View>
        </View>
    </AuthModalWrapper>
  );
}



const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
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
  requirementsContainer: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  requirementsTitle: {
    ...typography.labelCaps,
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    ...typography.bodyLg,
    color: COLORS.onSurfaceVariant,
  },
});
