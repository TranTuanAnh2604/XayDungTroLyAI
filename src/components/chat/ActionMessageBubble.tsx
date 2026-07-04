import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { markActionExecuted } from '../../services/chat';

type ActionMessageBubbleProps = {
  content: string;
  actionId: string;
  appName: string;
  deepLink?: string;
  fallbackUrl: string;
};

export default function ActionMessageBubble({
  content, actionId, appName, deepLink, fallbackUrl,
}: ActionMessageBubbleProps) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [executed, setExecuted] = useState(false);

  const handleOpen = async () => {
    try {
      if (deepLink) {
        const canOpen = await Linking.canOpenURL(deepLink);
        if (canOpen) {
          await Linking.openURL(deepLink);
          setExecuted(true);
          await markActionExecuted(actionId);
          return;
        }
      }
      await Linking.openURL(fallbackUrl);
      setExecuted(true);
      await markActionExecuted(actionId);
    } catch (err) {
      console.log('Không thể mở app:', err);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.bubble}>
        <Text style={styles.contentText}>{content}</Text>
        <TouchableOpacity
          style={[styles.actionButton, executed && styles.actionButtonDone]}
          onPress={handleOpen}
          disabled={executed}
        >
          <Text style={styles.actionButtonText}>
            {executed ? `Đã mở ${appName} ✓` : `Mở ${appName}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  wrapper: { alignItems: 'flex-start', marginBottom: 12, paddingHorizontal: 4 },
  bubble: {
    backgroundColor: COLORS.onPrimary,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    borderRadius: 16,
    padding: 14,
    maxWidth: '85%',
  },
  contentText: { fontSize: 14, color: COLORS.primary, marginBottom: 10 },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonDone: { backgroundColor: COLORS.primaryContainer },
  actionButtonText: { color: COLORS.onPrimary, fontWeight: '600', fontSize: 14 },
});
