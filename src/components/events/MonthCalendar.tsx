import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

interface MonthCalendarProps {
  selectedDateId: string;
  importantDates?: Set<string>;
  onSelect: (dateId: string) => void;
}

function formatLocalDateId(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MonthCalendar({ selectedDateId, importantDates, onSelect }: MonthCalendarProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  // View date tracks the month currently being viewed
  const initialDate = useMemo(() => {
    const d = new Date(selectedDateId);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDateId]);

  const [viewDate, setViewDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sync viewDate when selectedDateId changes significantly (different month/year)
  useEffect(() => {
    const d = new Date(selectedDateId);
    if (!isNaN(d.getTime())) {
      if (d.getMonth() !== viewDate.getMonth() || d.getFullYear() !== viewDate.getFullYear()) {
        setViewDate(d);
      }
    }
  }, [selectedDateId]);

  const generateMonthGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days = [];
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    // Padding for previous month
    const prevMonthDays = firstDayOfWeek;
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      days.push({
        id: formatLocalDateId(d),
        day: d.getDate(),
        isCurrentMonth: false,
        date: d,
      });
    }

    // Current month
    const totalDays = lastDayOfMonth.getDate();
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        id: formatLocalDateId(d),
        day: i,
        isCurrentMonth: true,
        date: d,
      });
    }

    // Padding for next month to complete 6 rows (42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        id: formatLocalDateId(d),
        day: i,
        isCurrentMonth: false,
        date: d,
      });
    }

    return days;
  };

  const days = useMemo(generateMonthGrid, [viewDate]);
  
  const todayId = useMemo(() => formatLocalDateId(new Date()), []);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.headerLeft} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.headerTitle}>
            {MONTH_NAMES[viewDate.getMonth()]}, {viewDate.getFullYear()}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={COLORS.onSurface} style={styles.dropdownIcon} />
        </Pressable>
        <View style={styles.navButtons}>
          {selectedDateId !== todayId && (
            <Pressable 
              onPress={() => onSelect(todayId)} 
              style={({ pressed }) => [styles.todayBtn, pressed && styles.todayBtnPressed]}
            >
              <MaterialIcons name="today" size={22} color={COLORS.primary} />
            </Pressable>
          )}
          <Pressable onPress={handlePrevMonth} style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}>
            <MaterialIcons name="chevron-left" size={24} color={COLORS.onSurface} />
          </Pressable>
          <Pressable onPress={handleNextMonth} style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Weekdays Row */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day, idx) => (
          <Text key={idx} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {days.map((item) => {
          const isSelected = item.id === selectedDateId;
          const isToday = item.id === todayId;
          const isImportant = importantDates?.has(item.id);

          let cellStyle: any = [styles.dayCell];
          let textStyle: any = [styles.dayText];
          let dotStyle: any = [styles.importantDot];

          if (isToday) {
            cellStyle.push(styles.dayCellToday);
            textStyle.push(styles.dayTextToday);
            dotStyle.push(styles.importantDotToday);
          } else if (isSelected) {
            cellStyle.push(styles.dayCellSelected);
            textStyle.push(styles.dayTextSelected);
            dotStyle.push(styles.importantDotSelected);
          } else if (!item.isCurrentMonth) {
            textStyle.push(styles.dayTextDimmed);
            dotStyle.push(styles.importantDotDimmed);
          }

          return (
            <View key={item.id} style={styles.dayCellContainer}>
              <Pressable
                onPress={() => onSelect(item.id)}
                style={cellStyle}
              >
                <Text style={textStyle}>{item.day}</Text>
                {isImportant && <View style={dotStyle} />}
              </Pressable>
            </View>
          );
        })}
      </View>
      
      <View style={styles.divider} />

      {showDatePicker && (
        <DateTimePicker
          value={viewDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setViewDate(selectedDate);
              // also jump selection to this date so logic stays synced
              onSelect(formatLocalDateId(selectedDate));
            }
          }}
        />
      )}
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    paddingTop: 8,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.headlineMd,
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    padding: 4,
    borderRadius: 20,
  },
  navBtnPressed: {
    backgroundColor: COLORS.surfaceVariant,
  },
  todayBtn: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  todayBtnPressed: {
    backgroundColor: `${COLORS.primary}33`,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayCellContainer: {
    width: '14.28%', // 100% / 7
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayCell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 15,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  dayCellToday: {
    backgroundColor: COLORS.primary,
  },
  dayTextToday: {
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dayTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayTextDimmed: {
    color: COLORS.textMuted,
  },
  importantDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.error,
  },
  importantDotSelected: {
    backgroundColor: COLORS.primary,
  },
  importantDotToday: {
    backgroundColor: COLORS.onPrimary,
  },
  importantDotDimmed: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    width: 60,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 1,
  }
});
