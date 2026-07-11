import { getTypography } from '../../constants/typography';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { useTheme } from '../../hooks/useTheme';

import type { MailItem, MailCategoryTone } from '../../types/mail';

type MailListItemProps = {
  email: MailItem;
  onPress?: () => void;
};

function toneStyles(tone: MailCategoryTone, COLORS: any) {
  switch (tone) {
    case 'emerald':
      return {
        iconBg: COLORS.emeraldTint,
        iconColor: COLORS.emeraldIcon,
      };
    case 'secondary':
      return {
        iconBg: `${COLORS.secondary}1A`,
        iconColor: COLORS.secondary,
      };
    default:
      return {
        iconBg: COLORS.primaryTint10,
        iconColor: COLORS.primary,
      };
  }
}

export default function MailListItem({ email, onPress }: MailListItemProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const tone = toneStyles(email.tone, COLORS);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.cardPressed,
      ]}
    >
      <AppGlassCard variant="surface" padding={16} style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: tone.iconBg }]}>
            <MaterialIcons name={email.icon} size={22} color={tone.iconColor} />
            {email.isPinned && (
              <View style={styles.pinnedBadge}>
                <MaterialIcons name="star" size={12} color="#F59E0B" />
              </View>
            )}
          </View>
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={styles.sender} numberOfLines={1}>
                {email.sender}
              </Text>
              <Text style={styles.time}>{email.time}</Text>
            </View>
            <Text style={styles.subject} numberOfLines={1}>
              {email.subject}
            </Text>
            <Text style={styles.preview} numberOfLines={1}>
              {email.preview}
            </Text>
          </View>
        </View>
      </AppGlassCard>
    </Pressable>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  pressable: {
    marginBottom: 8,
  },
  card: {},
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }, { translateY: -2 }],
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  sender: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  subject: {
    ...typography.bodyMd,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
});
