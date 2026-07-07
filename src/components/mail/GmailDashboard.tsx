import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import AppGlassCard from '../ui/AppGlassCard';
import PrimaryButton from '../ui/PrimaryButton';
import DynamicDashboardRenderer from './DynamicDashboardRenderer';
import DynamicPreferencesRenderer from './DynamicPreferencesRenderer';
import { getGmailDashboard, getGmailPreferences } from '../../services/gmail';

export default function GmailDashboard() {
  const { colors } = useTheme();
  const typography = React.useMemo(() => getTypography(colors), [colors]);
  const styles = React.useMemo(() => createStyles(colors, typography), [colors, typography]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<Record<string, any> | null>(null);
  const [preferencesData, setPreferencesData] = useState<Record<string, any> | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [dashboardRes, prefsRes] = await Promise.all([
        getGmailDashboard(),
        getGmailPreferences()
      ]);
      setDashboardData(dashboardRes);
      setPreferencesData(prefsRes);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu Gmail.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyLg, { color: colors.onBackground, marginTop: 16 }]}>
          Đang tải dữ liệu...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AppGlassCard style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} style={{ marginBottom: 16 }} />
          <Text style={[typography.headlineMd, { color: colors.error, marginBottom: 8 }]}>Lỗi</Text>
          <Text style={[typography.bodyMd, { color: colors.onSurface, textAlign: 'center', marginBottom: 24 }]}>
            {error}
          </Text>
          <PrimaryButton label="Thử lại" onPress={() => loadData(false)} />
        </AppGlassCard>
      </View>
    );
  }

  const isDashboardEmpty = !dashboardData || Object.keys(dashboardData).length === 0;
  const isPrefsEmpty = !preferencesData || Object.keys(preferencesData).length === 0;

  if (isDashboardEmpty && isPrefsEmpty) {
    return (
      <ScrollView 
        contentContainerStyle={styles.centerContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <MaterialIcons name="inbox" size={64} color={colors.onSurfaceVariant} style={{ marginBottom: 16 }} />
        <Text style={[typography.headlineSm, { color: colors.onSurfaceVariant }]}>
          Chưa có dữ liệu Gmail.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {dashboardData && <DynamicDashboardRenderer data={dashboardData} />}
      {preferencesData && <DynamicPreferencesRenderer data={preferencesData} />}
    </ScrollView>
  );
}

function createStyles(colors: any, typography: any) {
  return StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16, // SPACING.lg
      minHeight: 400,
    },
    scrollContent: {
      padding: 16, // SPACING.lg
    },
    errorCard: {
      alignItems: 'center',
      padding: 24, // SPACING.xl
      width: '100%',
    },
  });
}
