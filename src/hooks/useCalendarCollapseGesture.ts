import { useRef, useMemo } from 'react';
import { Animated, PanResponder } from 'react-native';

export const ROW_HEIGHT = 50;
export const MONTH_VIEW_HEIGHT = ROW_HEIGHT * 6;
export const WEEK_VIEW_HEIGHT = ROW_HEIGHT;

export function useCalendarCollapseGesture(selectedWeekIndex: number) {
  const heightAnim = useRef(new Animated.Value(MONTH_VIEW_HEIGHT)).current;
  const isWeekViewRef = useRef(false);
  const startHeightRef = useRef(MONTH_VIEW_HEIGHT);

  const progress = heightAnim.interpolate({
    inputRange: [WEEK_VIEW_HEIGHT, MONTH_VIEW_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const gridTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -selectedWeekIndex * ROW_HEIGHT]
  });

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: () => {
      startHeightRef.current = isWeekViewRef.current ? WEEK_VIEW_HEIGHT : MONTH_VIEW_HEIGHT;
      heightAnim.stopAnimation();
    },
    onPanResponderMove: (_, gestureState) => {
      const newHeight = Math.max(
        WEEK_VIEW_HEIGHT,
        Math.min(MONTH_VIEW_HEIGHT, startHeightRef.current + gestureState.dy)
      );
      heightAnim.setValue(newHeight);
    },
    onPanResponderRelease: (_, gestureState) => {
      const currentHeight = startHeightRef.current + gestureState.dy;
      const midPoint = (MONTH_VIEW_HEIGHT + WEEK_VIEW_HEIGHT) / 2;
      
      let snapToWeek = false;

      // Ưu tiên velocity, nếu vuốt nhanh thì snap luôn
      if (gestureState.vy < -0.3) {
        snapToWeek = true;
      } else if (gestureState.vy > 0.3) {
        snapToWeek = false;
      } else {
        // Dựa vào vị trí hiện tại
        snapToWeek = currentHeight < midPoint;
      }

      isWeekViewRef.current = snapToWeek;
      
      Animated.spring(heightAnim, {
        toValue: snapToWeek ? WEEK_VIEW_HEIGHT : MONTH_VIEW_HEIGHT,
        useNativeDriver: false, // Bắt buộc false khi animate height
        bounciness: 0,
        speed: 14,
      }).start();
    },
    onPanResponderTerminate: () => {
      // Khôi phục lại trạng thái nếu bị hủy
      Animated.spring(heightAnim, {
        toValue: isWeekViewRef.current ? WEEK_VIEW_HEIGHT : MONTH_VIEW_HEIGHT,
        useNativeDriver: false,
        bounciness: 0,
        speed: 14,
      }).start();
    }
  }), []);

  // Update logic: Khi chuyển tháng, tự động mở ra Month View
  const expandToMonth = () => {
    if (isWeekViewRef.current) {
      isWeekViewRef.current = false;
      Animated.spring(heightAnim, {
        toValue: MONTH_VIEW_HEIGHT,
        useNativeDriver: false,
        bounciness: 0,
        speed: 14,
      }).start();
    }
  };

  return {
    heightAnim,
    progress,
    gridTranslateY,
    panResponder,
    expandToMonth
  };
}
