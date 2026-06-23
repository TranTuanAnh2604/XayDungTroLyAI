import React, { useEffect, useState } from 'react';
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
import BorderTextInput from '../ui/BorderTextInput';
import PrimaryButton from '../ui/PrimaryButton';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
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
  const insets = useSafeAreaInsets();
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
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
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập địa chỉ email của bạn để nhận hướng dẫn đặt lại mật khẩu
          </Text>

          {/* Email Input */}
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
        </IosGlassView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
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
