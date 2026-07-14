import React, { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TaskModalContainerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function TaskModalContainer({
  visible,
  onClose,
  children,
}: TaskModalContainerProps) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 24,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      animationType="none"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <View style={[styles.contentWrapper, { paddingTop: Math.max(insets.top + 40, 60) }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <Animated.View style={[styles.sheetContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
    maxHeight: '90%', 
  },
  scrollContent: {
    paddingHorizontal: 20, 
    paddingTop: 16,
    paddingBottom: 16, 
  },
});
