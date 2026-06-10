import React, { useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { CalendarDateItem } from '../../types/events';

type DateSelectorStripProps = {
  monthLabel: string;
  todayLabel: string;
  dates: CalendarDateItem[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function DateSelectorStrip({
  monthLabel,
  todayLabel,
  dates,
  selectedId,
  onSelect,
}: DateSelectorStripProps) {
  const scrollRef = useRef<ScrollView>(null);

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollTo({ x: offset, animated: true });
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.month}>{monthLabel}</Text>
          <Text style={styles.today}>{todayLabel}</Text>
        </View>
        <View style={styles.nav}>
          <Pressable
            onPress={() => scrollBy(-100)}
            style={({ pressed }) => [styles.navBtn, pressed && styles.navPressed]}
          >
            <MaterialIcons name="chevron-left" size={20} color={COLORS.onSurface} />
          </Pressable>
          <Pressable
            onPress={() => scrollBy(100)}
            style={({ pressed }) => [styles.navBtn, pressed && styles.navPressed]}
          >
            <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {dates.map((date) => {
          const active = date.id === selectedId;
          return (
            <Pressable
              key={date.id}
              onPress={() => onSelect(date.id)}
              style={[styles.dateItem, active && styles.dateItemActive]}
            >
              <Text
                style={[styles.weekday, active && styles.weekdayActive]}
              >
                {date.weekday}
              </Text>
              <Text style={[styles.day, active && styles.dayActive]}>
                {date.day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  month: {
    ...typography.labelCaps,
    letterSpacing: 2,
    marginBottom: 4,
  },
  today: {
    ...typography.headlineMd,
    fontSize: 24,
  },
  nav: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPressed: {
    backgroundColor: COLORS.surfaceContainer,
    transform: [{ scale: 0.9 }],
  },
  scroll: {
    gap: 8,
    paddingBottom: 8,
  },
  dateItem: {
    minWidth: 56,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xl,
  },
  dateItemActive: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.1 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  weekday: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.outline,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  weekdayActive: {
    color: COLORS.onPrimary,
    opacity: 0.8,
  },
  day: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  dayActive: {
    color: COLORS.onPrimary,
  },
});
