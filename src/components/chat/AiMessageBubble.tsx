import { getTypography } from '../../constants/typography';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_NAME } from '../../constants/brand';
import MessageLabel from './MessageLabel';
import { RADIUS, SHADOW } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';


type AiMessageBubbleProps = {
  content: string;
  label?: string;
};

export default function AiMessageBubble({
  content,
  label = APP_NAME,
}: AiMessageBubbleProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  return (
    <View style={styles.wrapper}>
      {/* <MessageLabel text={label} showLogo /> */}
      <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
        <LinearGradient
          colors={[COLORS.chatAiGradientStart, COLORS.chatAiGradientEnd]}
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

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  wrapper: {
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  bubble: {
    padding: 16,
    borderRadius: RADIUS.xl,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...SHADOW.card,
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  text: {
    ...typography.bodyLg,
    color: COLORS.onSurface,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
});
