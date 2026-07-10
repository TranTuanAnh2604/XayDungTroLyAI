import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomNavBar } from '../components/navigation';
import ChatNavigator from './ChatNavigator';
import HomeScreen from '../screens/home/HomeScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import EventsScreen from '../screens/events/EventsScreen';
import MailScreen from '../screens/mail/MailScreen';
import { useTheme } from '../hooks/useTheme';
import type { AppTabId } from '../types/navigation';
import type { RootStackParamList } from './types';

export default function MainNavigator() {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const [activeTab, setActiveTab] = useState<AppTabId>('home');
  const [visitedTabs, setVisitedTabs] = useState<Set<AppTabId>>(new Set(['home']));
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const route = useRoute<RouteProp<RootStackParamList, 'Main'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
      navigation.setParams({ tab: undefined });
    }
  }, [route.params?.tab, navigation]);

  useEffect(() => {
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const renderScreen = (tabId: AppTabId, Component: React.ComponentType) => {
    if (!visitedTabs.has(tabId)) return null;
    return (
      <View key={tabId} style={[styles.screenContainer, { display: activeTab === tabId ? 'flex' : 'none' }]}>
        <Component />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {renderScreen('home', HomeScreen)}
        {renderScreen('chat', ChatNavigator)}
        {renderScreen('tasks', TasksScreen)}
        {renderScreen('calendar', EventsScreen)}
        {renderScreen('mail', MailScreen)}
      </Animated.View>
      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
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
