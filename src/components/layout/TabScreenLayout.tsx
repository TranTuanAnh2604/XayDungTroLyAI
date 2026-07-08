import React, { type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getBottomNavReservedHeight,
  getTopAppBarHeight,
  SCREEN_CONTENT_MAX_WIDTH,
  SCROLL_CONTENT_GAP,
  SCROLL_SECTION_GAP,
} from '../../constants/layout';
import { SPACING } from '../../constants/spacing';
import { useTheme } from '../../hooks/useTheme';

type TabScreenLayoutProps = {
  topBar: ReactNode;
  children: ReactNode;
  bottomExtra?: number;
  footer?: ReactNode;
  scrollViewProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  innerStyle?: any; // ViewStyle
  scrollRef?: React.RefObject<any>; // ScrollView
  disableScrollWrapper?: boolean;
  maxContentWidth?: number;
};

/**
 * Tab shell: scroll under TopAppBar, centered column, consistent section spacing.
 */
export default function TabScreenLayout({
  topBar,
  children,
  bottomExtra = 0,
  footer,
  scrollViewProps,
  contentContainerStyle,
  innerStyle,
  scrollRef,
  disableScrollWrapper = false,
  maxContentWidth = SCREEN_CONTENT_MAX_WIDTH,
}: TabScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const topChrome = getTopAppBarHeight(insets);
  const bottomChrome = getBottomNavReservedHeight(insets);

  return (
    <View style={styles.root}>
      {topBar}

      {disableScrollWrapper ? (
        <View style={styles.scroll}>
          {children}
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: topChrome + SCROLL_CONTENT_GAP,
              paddingBottom: bottomChrome + bottomExtra + SCROLL_CONTENT_GAP,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          <View style={[styles.inner, { maxWidth: maxContentWidth }, innerStyle]}>
            {children}
          </View>
        </ScrollView>
      )}

      {footer}
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.containerMobile,
  },
  inner: {
    width: '100%',
    gap: SCROLL_SECTION_GAP,
  },
});
