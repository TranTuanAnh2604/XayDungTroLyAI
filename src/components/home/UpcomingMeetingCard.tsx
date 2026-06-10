import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppGlassCard from '../ui/AppGlassCard';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { UpcomingMeeting } from '../../types/home';

type UpcomingMeetingCardProps = {
  meeting: UpcomingMeeting;
  onJoinPress?: () => void;
};

export default function UpcomingMeetingCard({
  meeting,
  onJoinPress,
}: UpcomingMeetingCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sắp tới</Text>
      <AppGlassCard variant="elevated" padding={20}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{meeting.badge}</Text>
        </View>
        <Text style={styles.title}>{meeting.title}</Text>
        <Text style={styles.time}>{meeting.time}</Text>

        <View style={styles.footer}>
          <View style={styles.avatars}>
            {meeting.attendees.map((a, index) => (
              <Image
                key={a.id}
                source={{ uri: a.avatarUri }}
                style={[
                  styles.avatar,
                  index > 0 && styles.avatarOverlap,
                ]}
              />
            ))}
            {meeting.extraAttendees > 0 && (
              <View style={[styles.avatar, styles.avatarOverlap, styles.extra]}>
                <Text style={styles.extraText}>+{meeting.extraAttendees}</Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={onJoinPress}
            style={({ pressed }) => [
              styles.joinBtn,
              pressed && styles.joinPressed,
            ]}
          >
            <Text style={styles.joinLabel}>Tham gia ngay</Text>
          </Pressable>
        </View>
      </AppGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  sectionTitle: {
    ...typography.headlineMd,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryContainerTint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.primary,
  },
  title: {
    ...typography.headlineSm,
    marginTop: 4,
  },
  time: {
    ...typography.bodyMd,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  extra: {
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  joinBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  joinLabel: {
    ...typography.labelCaps,
    color: COLORS.onPrimary,
    fontSize: 14,
    textTransform: 'none',
    letterSpacing: 0,
  },
  joinPressed: {
    transform: [{ scale: 0.95 }],
  },
});
