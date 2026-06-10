import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomNavBar } from '../components/navigation';
import ChatNavigator from './ChatNavigator';
import HomeScreen from '../screens/home/HomeScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import EventsScreen from '../screens/events/EventsScreen';
import MailScreen from '../screens/mail/MailScreen';
import { COLORS } from '../constants/theme';
import type { AppTabId } from '../types/navigation';

export default function MainNavigator() {
  const [activeTab, setActiveTab] = useState<AppTabId>('home');

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
      {renderScreen()}
      <BottomNavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
