import { getTypography } from '../../constants/typography';
import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Alert,
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BorderTextInput from '../ui/BorderTextInput';
import PrimaryButton from '../ui/PrimaryButton';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import AuthModalWrapper from './AuthModalWrapper';

import IosGlassView from '../ui/IosGlassView';

type ForgotPasswordModalProps = {
  visible: boolean;
  onClose?: () => void;
  onSubmit: (email: string) => Promise<void>;
};

export default function ForgotPasswordModal({
  visible,
  onClose,
  onSubmit,
}: ForgotPasswordModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form only when modal opens and loading is done
  useEffect(() => {
    if (visible && !isLoading) {
      setEmail('');
    }
  }, [visible, isLoading]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(email);
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

  return (
    <AuthModalWrapper
      visible={visible}
      title="Quên mật khẩu?"
      subtitle="Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu."
      onClose={handleClose}
    >
      <View style={styles.form}>
        <BorderTextInput
          label="Email"
          placeholder="example@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          testID="forgot-password-email"
        />
      </View>

      {/* Submit Button */}
      <PrimaryButton
        label="Tiếp tục"
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.submitButton}
      />

      {/* Info text */}
      <Text style={styles.infoText}>
        Chúng tôi sẽ gửi mã OTP xác nhận đến email của bạn
      </Text>
    </AuthModalWrapper>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  form: {
    marginBottom: 20,
    gap: 16,
  },
  submitButton: {
    marginBottom: 16,
  },
  infoText: {
    ...typography.bodyLg,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.7,
  },
});
