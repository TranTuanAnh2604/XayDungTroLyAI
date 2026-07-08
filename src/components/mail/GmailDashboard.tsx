import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import AppGlassCard from '../ui/AppGlassCard';
import PrimaryButton from '../ui/PrimaryButton';
import DynamicDashboardRenderer from './DynamicDashboardRenderer';
import DynamicPreferencesRenderer from './DynamicPreferencesRenderer';
import { getGmailDashboard, getGmailPreferences } from '../../services/gmail';

const DASHBOARD_CACHE_KEY = '@app:mail:dashboard_cache';
const PREFS_CACHE_KEY = '@app:mail:prefs_cache';
const LAST_DASHBOARD_SYNC_KEY = '@app:mail:dashboard_last_sync';
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

interface GmailDashboardProps {
  contentContainerStyle?: any;
}

export default function GmailDashboard({ contentContainerStyle }: GmailDashboardProps) {
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
      // 1. Load from cache first
      if (!isRefresh) {
        const cachedDashStr = await AsyncStorage.getItem(DASHBOARD_CACHE_KEY);
        const cachedPrefsStr = await AsyncStorage.getItem(PREFS_CACHE_KEY);
        let hasCache = false;

        if (cachedDashStr && cachedPrefsStr) {
          try {
            setDashboardData(JSON.parse(cachedDashStr));
            setPreferencesData(JSON.parse(cachedPrefsStr));
            setLoading(false); // Render cache immediately
            hasCache = true;
          } catch (e) {
            console.warn('Failed to parse dashboard cache', e);
          }
        }

        // 2. Check if sync is needed
        const lastSyncStr = await AsyncStorage.getItem(LAST_DASHBOARD_SYNC_KEY);
        if (hasCache && lastSyncStr && (Date.now() - parseInt(lastSyncStr, 10)) < DASHBOARD_CACHE_TTL_MS) {
          return; // skip fetching
        }
      }

      // Fetch fresh data
      const [dashboardRes, prefsRes] = await Promise.all([
        getGmailDashboard(),
        getGmailPreferences()
      ]);

      setDashboardData(dashboardRes);
      setPreferencesData(prefsRes);

      // Save to cache
      await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(dashboardRes));
      await AsyncStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(prefsRes));
      await AsyncStorage.setItem(LAST_DASHBOARD_SYNC_KEY, Date.now().toString());
      // Trigger background AI sync for any unlabeled emails
      if (!isRefresh) {
        setTimeout(async () => {
          try {
            const { autoSyncGmail } = require('../../services/gmail');
            const syncRes = await autoSyncGmail();
            if (syncRes && syncRes.addedSummaries > 0) {
              console.log('[GmailDashboard] AI classified new emails. Refreshing dashboard...');
              const freshDash = await getGmailDashboard();
              setDashboardData(freshDash);
              await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(freshDash));
            }
          } catch (e) {
            console.warn('[GmailDashboard] Background autoSync failed:', e);
          }
        }, 1000);
      }
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
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
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
