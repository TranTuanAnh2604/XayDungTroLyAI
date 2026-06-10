import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { ProjectCard as ProjectCardType } from '../../types/tasks';

type ProjectCardProps = {
  project: ProjectCardType;
  index?: number;
};

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 400 + index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 400 + index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, index, slideAnim]);

  const iconBg =
    project.iconTone === 'secondary'
      ? `${COLORS.secondary}1A`
      : `${COLORS.primary}1A`;
  const iconColor =
    project.iconTone === 'secondary' ? COLORS.secondary : COLORS.primary;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <AppGlassCard variant="surface" padding={16} style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={project.icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.title}>{project.title}</Text>
        {project.type === 'team' && project.teamAvatars ? (
          <View style={styles.teamRow}>
            <View style={styles.avatars}>
              {project.teamAvatars.map((uri, i) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={[styles.avatar, i > 0 && styles.avatarOverlap]}
                />
              ))}
            </View>
            {project.extraMembers ? (
              <Text style={styles.extra}>+{project.extraMembers} khác</Text>
            ) : null}
          </View>
        ) : null}
        {project.type === 'progress' ? (
          <View style={styles.progressRow}>
            <Text style={styles.taskCount}>{project.taskCount} Tasks</Text>
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  { width: `${project.progressPercent ?? 0}%` },
                ]}
              />
            </View>
          </View>
        ) : null}
      </AppGlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
  },
  card: {
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.surfaceContainerLow,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  extra: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.outline,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskCount: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.outline,
  },
  miniTrack: {
    width: 40,
    height: 4,
    borderRadius: 9999,
    backgroundColor: `${COLORS.outlineVariant}4D`,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
  },
});
