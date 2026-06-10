import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MessageLabel from './MessageLabel';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';

type UserMessageBubbleProps = {
  content: string;
};

export default function UserMessageBubble({ content }: UserMessageBubbleProps) {
  return (
    <View style={styles.wrapper}>
      <MessageLabel text="Bạn" align="right" />
      <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
        <LinearGradient
          colors={[COLORS.chatUserGradientStart, COLORS.chatUserGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bubble}
        >
          <Text style={styles.text}>{content}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '85%',
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  bubble: {
    padding: 16,
    borderRadius: RADIUS.xl,
    borderTopRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    ...typography.bodyLg,
    color: COLORS.onPrimary,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
});
