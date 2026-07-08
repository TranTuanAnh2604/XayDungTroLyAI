import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { BottomNavBar } from '../components/navigation';
import ChatNavigator from './ChatNavigator';
import HomeScreen from '../screens/home/HomeScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import EventsScreen from '../screens/events/EventsScreen';
import MailScreen from '../screens/mail/MailScreen';
import { useTheme } from '../hooks/useTheme';
import type { AppTabId } from '../types/navigation';

export default function MainNavigator() {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const [activeTab, setActiveTab] = useState<AppTabId>('home');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'chat':
        return <ChatNavigator />;
      case 'tasks':
        return <TasksScreen />;
      case 'calendar':
        return <EventsScreen />;
      case 'mail':
        return <MailScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {renderScreen()}
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
});
