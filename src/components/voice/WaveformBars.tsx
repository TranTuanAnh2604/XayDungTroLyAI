import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const BAR_COUNT = 7;

export default function WaveformBars() {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 40),
  );

  useEffect(() => {
    let frame: number;
    const tick = () => {
      const time = Date.now() / 200;
      setHeights(
        Array.from({ length: BAR_COUNT }, (_, index) => {
          const variance = Math.sin(time + index) * 15;
          const base = 30 + Math.sin(time * 0.8 + index * 0.5) * 20;
          return Math.max(10, Math.min(80, base + variance));
        }),
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <View style={styles.row}>
      {heights.map((height, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height: 80 * (height / 100),
              backgroundColor:
                index % 2 === 0
                  ? `${COLORS.primary}CC`
                  : `${COLORS.secondary}CC`,
            },
          ]}
        />
      ))}
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    height: 80,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    minHeight: 8,
  },
});
