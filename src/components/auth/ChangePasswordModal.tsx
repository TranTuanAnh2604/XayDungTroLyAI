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
import { changePassword } from '../../services/auth';
import AuthModalWrapper from './AuthModalWrapper';

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
    <AuthModalWrapper
      visible={visible}
      title="Đổi mật khẩu"
      subtitle="Tạo mật khẩu mới cho tài khoản của bạn"
      onClose={handleClose}
    >
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

        {/* Submit Button */}
        <PrimaryButton
          label="Lưu thay đổi"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitButton}
        />
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
});
