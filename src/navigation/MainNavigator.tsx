import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PagerView from 'react-native-pager-view';
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);
import { BottomNavBar } from '../components/navigation';
import ChatNavigator from './ChatNavigator';
import HomeScreen from '../screens/home/HomeScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import EventsScreen from '../screens/events/EventsScreen';
import MailScreen from '../screens/mail/MailScreen';
import { useTheme } from '../hooks/useTheme';
import type { AppTabId } from '../types/navigation';
import type { RootStackParamList } from './types';

const TAB_ORDER: AppTabId[] = ['home', 'chat', 'tasks', 'calendar', 'mail'];

export default function MainNavigator() {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const [activeTab, setActiveTab] = useState<AppTabId>('home');
  const [visitedTabs, setVisitedTabs] = useState<Set<AppTabId>>(new Set(['home']));
  const pagerRef = useRef<any>(null);
  const positionAnimated = useRef(new Animated.Value(0)).current;
  const offsetAnimated = useRef(new Animated.Value(0)).current;
  const scrollPosition = useRef(Animated.add(positionAnimated, offsetAnimated)).current;
  const route = useRoute<RouteProp<RootStackParamList, 'Main'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();

  const handleTabPress = (tabId: AppTabId) => {
    const index = TAB_ORDER.indexOf(tabId);
    if (index !== -1) {
      pagerRef.current?.setPage(index);
      setActiveTab(tabId);
      setVisitedTabs((prev) => {
        if (prev.has(tabId)) return prev;
        const next = new Set(prev);
        next.add(tabId);
        return next;
      });
    }
  };

  useEffect(() => {
    if (route.params?.tab) {
      handleTabPress(route.params.tab);
      navigation.setParams({ tab: undefined });
    }
  }, [route.params?.tab, navigation]);

  const handlePageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    const tabId = TAB_ORDER[index];
    
    LayoutAnimation.configureNext({
      duration: 650,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'spring', springDamping: 0.55 },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });

    setActiveTab(tabId);
    setVisitedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
  };

  const renderScreen = (tabId: AppTabId, Component: React.ComponentType) => {
    if (!visitedTabs.has(tabId)) {
      return <View key={tabId} style={styles.screenContainer} />;
    }
    return (
      <View key={tabId} style={styles.screenContainer}>
        <Component />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <AnimatedPagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={TAB_ORDER.indexOf(activeTab)}
        onPageScroll={Animated.event(
          [{ nativeEvent: { position: positionAnimated, offset: offsetAnimated } }],
          { useNativeDriver: false }
        )}
        onPageSelected={handlePageSelected}
      >
        {renderScreen('home', HomeScreen)}
        {renderScreen('chat', ChatNavigator)}
        {renderScreen('tasks', TasksScreen)}
        {renderScreen('calendar', EventsScreen)}
        {renderScreen('mail', MailScreen)}
      </AnimatedPagerView>
      <BottomNavBar activeTab={activeTab} scrollPosition={scrollPosition} onTabPress={handleTabPress} />
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
});
