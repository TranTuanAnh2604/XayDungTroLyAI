import { getTypography } from '../../constants/typography';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

import type { TimelineEvent } from '../../types/events';

type TimelineEventItemProps = {
  event: TimelineEvent;
  index?: number;
  isLast?: boolean;
  onEdit?: () => void;
};

export default function TimelineEventItem({
  event,
  index = 0,
  isLast = false,
  onEdit,
}: TimelineEventItemProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Log component lifecycle for debugging
  console.log(`[TimelineEventItem-render] id=${event.id}, type=${event.type}, title=${event.title}`);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, index, slideAnim]);

  // Detect event type changes (e.g., from break → meeting) and reset state
  useEffect(() => {
    console.log(`[TimelineEventItem-typechange] id=${event.id}, type=${event.type}, resetting expanded state`);
    setExpanded(false);
  }, [event.type, event.id]);

  useEffect(() => {
    if (event.type !== 'urgent') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [event.type, pulseAnim]);

  const canExpand =
    event.type === 'urgent' ||
    event.type === 'meeting' ||
    event.type === 'task';

  const renderMarker = () => {
    switch (event.type) {
      case 'urgent':
        return (
          <Animated.View
            style={[
              styles.marker,
              styles.markerUrgent,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <MaterialIcons name="priority-high" size={20} color={`${COLORS.error}CC`} />
          </Animated.View>
        );
      case 'meeting':
        return (
          <View style={[styles.marker, styles.markerDefault]}>
            <MaterialIcons name="videocam" size={20} color={COLORS.primary} />
          </View>
        );
      case 'break':
        return (
          <View style={[styles.marker, styles.markerBreak]}>
            <MaterialIcons name="restaurant" size={20} color={COLORS.outline} />
          </View>
        );
      case 'task':
        return (
          <View style={[styles.marker, styles.markerDefault]}>
            <MaterialIcons name="check-circle" size={20} color={COLORS.tertiary} />
          </View>
        );
    }
  };

  const renderBody = () => {
    console.log(`[TimelineEventItem-renderbody] type=${event.type}, rendering conditional layout`);

    if (event.type === 'break') {
      console.log(`[TimelineEventItem-renderbody-break] title=${event.title}`);
      return (
        <Pressable
          onPress={onEdit ? () => setExpanded((v) => !v) : undefined}
          style={onEdit ? styles.breakPressable : undefined}
        >
          <AppGlassCard variant="surface" padding={12} style={styles.breakCard}>
            <Text style={styles.breakText}>{event.title}</Text>
            {expanded && onEdit ? (
              <View style={styles.expanded}>
                <Pressable
                  onPress={onEdit}
                  style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
                >
                  <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                  <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                </Pressable>
              </View>
            ) : null}
          </AppGlassCard>
        </Pressable>
      );
    }

    if (event.type === 'task') {
      console.log(`[TimelineEventItem-renderbody-task] title=${event.title}`);
      return (
        <Pressable onPress={() => setExpanded((v) => !v)}>
          <AppGlassCard
            variant="surface"
            padding={20}
            style={styles.cardInner}
          >
            <View style={styles.taskRow}>
              <View style={[styles.taskCheck, expanded && styles.taskCheckDone]} />
              <Text style={styles.cardTitle}>{event.title}</Text>
            </View>
            <View style={styles.tags}>
              {(event.tags ?? []).map((tag, tagIndex) => (
                <View key={`${tag}-${tagIndex}`} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            {expanded && event.expandedDetail ? (
              <View style={styles.expanded}>
                <Text style={styles.expandedText}>{event.expandedDetail}</Text>
                {onEdit ? (
                  <Pressable
                    onPress={onEdit}
                    style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
                  >
                    <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                    <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </AppGlassCard>
        </Pressable>
      );
    }

    const isUrgent = event.type === 'urgent';
    const isMeeting = event.type === 'meeting';

    // Defensive checks for required props
    if ((isUrgent || isMeeting) && !event.title) {
      console.warn(`[TimelineEventItem-error] ${event.type} event missing title:`, event);
      return <View style={styles.errorCard}><Text>Event data missing</Text></View>;
    }
    if ((isUrgent || isMeeting) && !event.description) {
      console.warn(`[TimelineEventItem-error] ${event.type} event missing description:`, event);
      return <View style={styles.errorCard}><Text>Event data incomplete</Text></View>;
    }
    if ((isUrgent || isMeeting) && !event.badge) {
      console.warn(`[TimelineEventItem-error] ${event.type} event missing badge:`, event);
      return <View style={styles.errorCard}><Text>Event data incomplete</Text></View>;
    }
    if (isMeeting && !event.joinLabel) {
      console.warn(`[TimelineEventItem-error] meeting event missing joinLabel:`, event);
      return <View style={styles.errorCard}><Text>Event data incomplete</Text></View>;
    }

    console.log(`[TimelineEventItem-renderbody-meeting/urgent] title=${event.title}, description=${event.description}, badge=${event.badge}`);

    return (
      <Pressable
        onPress={canExpand ? () => setExpanded((v) => !v) : undefined}
      >
        <AppGlassCard
          variant="surface"
          padding={20}
          style={[styles.cardInner, isUrgent && styles.cardUrgent]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{event.title}</Text>
            <View
              style={[
                styles.badge,
                isUrgent ? styles.badgeUrgent : styles.badgePrimary,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isUrgent ? styles.badgeTextUrgent : styles.badgeTextPrimary,
                ]}
              >
                {event.badge || 'N/A'}
              </Text>
            </View>
          </View>

          {isUrgent || isMeeting ? (
            <Text style={styles.description}>{event.description || 'No description'}</Text>
          ) : null}

          {isUrgent && event.avatars ? (
            <View style={styles.avatars}>
              {event.avatars.map((uri, i) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={[styles.avatar, i > 0 && styles.avatarOverlap]}
                />
              ))}
            </View>
          ) : null}

          {isMeeting ? (
            <Pressable style={({ pressed }) => [styles.joinBtn, pressed && styles.btnPressed]}>
              <MaterialIcons name="play-circle-filled" size={18} color={COLORS.onPrimary} />
              <Text style={styles.joinText}>{event.joinLabel || 'Join'}</Text>
            </Pressable>
          ) : null}

          {expanded && event.expandedDetail ? (
            <View style={styles.expanded}>
              <Text style={styles.expandedText}>{event.expandedDetail}</Text>
              {onEdit ? (
                <Pressable
                  onPress={onEdit}
                  style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
                >
                  <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                  <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </AppGlassCard>
      </Pressable>
    );
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: isLast ? 0 : 24,
      }}
    >
      <View style={styles.row}>
        <View style={styles.timeCol}>
          {renderMarker()}
          <Text style={styles.time}>{event.time}</Text>
        </View>
        <View style={styles.bodyCol}>{renderBody()}</View>
      </View>
    </Animated.View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 24,
  },
  timeCol: {
    width: 40,
    alignItems: 'center',
    paddingTop: 8,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: COLORS.surface,
  },
  markerUrgent: {
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  markerDefault: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  markerBreak: {
    borderWidth: 1,
    borderColor: `${COLORS.outlineVariant}33`,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  bodyCol: {
    flex: 1,
  },
  cardInner: {},
  errorCard: {
    backgroundColor: COLORS.errorTint,
    padding: 16,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 60,
  },
  cardUrgent: {
    borderColor: COLORS.errorCardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    ...typography.bodyLg,
    fontWeight: '700',
    flex: 1,
    color: COLORS.onSurface,
  },
  description: {
    ...typography.bodyMd,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  badgeUrgent: {
    backgroundColor: COLORS.errorTint,
  },
  badgePrimary: {
    backgroundColor: COLORS.primaryTint10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  badgeTextUrgent: {
    color: `${COLORS.error}CC`,
  },
  badgeTextPrimary: {
    color: COLORS.primary,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.surfaceContainerLowest,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.xl,
  },
  joinText: {
    ...typography.labelCaps,
    color: COLORS.onPrimary,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '700',
  },
  btnPressed: {
    transform: [{ scale: 0.95 }],
  },
  expanded: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.outlineVariant}33`,
  },
  expandedText: {
    ...typography.bodyMd,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  editBtnText: {
    ...typography.labelCaps,
    color: COLORS.primary,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  breakCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderLeftWidth: 2,
    borderLeftColor: `${COLORS.outlineVariant}4D`,
    borderStyle: 'dashed',
  },
  breakPressable: {
    borderRadius: RADIUS.xl,
  },
  breakText: {
    ...typography.bodyMd,
    fontStyle: 'italic',
    color: COLORS.textMuted,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
  },
  taskCheckDone: {
    backgroundColor: COLORS.tertiary,
    borderColor: COLORS.tertiary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.tertiary,
  },
});
