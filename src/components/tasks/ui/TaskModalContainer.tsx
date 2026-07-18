import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';

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
  const { colors: COLORS } = useTheme();
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Tạo một giá trị Animated để nâng hạ toàn bộ sheet một cách chủ động theo bàn phím
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;
  
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      onClose();
    }, 150);
  };

  // Đồng bộ hiệu ứng Tắt/Mở Modal
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
      Keyboard.dismiss();
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

  // Luồng lắng nghe bàn phím độc lập để tự tính toán khoảng nâng (Chữa dứt điểm lỗi che và dư khoảng trống)
  // Luồng lắng nghe bàn phím độc lập để tự tính toán khoảng nâng
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e: KeyboardEvent) => {
      const keyboardHeight = e.endCoordinates?.height || 0;
      
      Animated.timing(keyboardHeightAnim, {
        toValue: Platform.OS === 'ios' ? keyboardHeight : keyboardHeight - (insets.bottom || 0),
        duration: Platform.OS === 'ios' ? e.duration : 150,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();
    };

    const onKeyboardHide = (e: KeyboardEvent) => {
      Animated.timing(keyboardHeightAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 150,
        useNativeDriver: false,
      }).start();
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={handleClose}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Biến đổi View wrapper này thành Animated.View để cộng dãn paddingBottom động */}
        <Animated.View 
          style={[
            styles.contentWrapper, 
            { 
              paddingTop: Math.max(insets.top + 20, 40),
              paddingBottom: keyboardHeightAnim // Đẩy mượt mà đúng bằng chiều cao bàn phím hệ thống
            }
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
          
          <Animated.View 
            style={[
              styles.sheetContainer, 
              { 
                backgroundColor: COLORS.surface, 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.innerContent}>
                  {children}
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
    maxHeight: '80%', // Rút nhẹ lại một chút tạo không gian co giãn an toàn
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContent: {
    paddingHorizontal: 20, 
    paddingTop: 16,
    paddingBottom: 24,
  }
});