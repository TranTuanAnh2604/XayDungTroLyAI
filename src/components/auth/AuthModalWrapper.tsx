import React, { useMemo } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import IosGlassView from '../ui/IosGlassView';
import { RADIUS } from '../../constants/theme';
import { getTypography } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';

type AuthModalWrapperProps = {
  visible: boolean;
  title: string;
  subtitle: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
};

export default function AuthModalWrapper({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: AuthModalWrapperProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
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
                onPress={onClose}
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
            <Text style={styles.title}>{title}</Text>
            {typeof subtitle === 'string' ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : (
              subtitle
            )}

            {/* Form Content */}
            {children}
          </IosGlassView>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
});
