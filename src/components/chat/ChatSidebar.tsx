import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import { RADIUS } from '../../constants/theme';

export const SIDEBAR_WIDTH = Math.min(Dimensions.get('window').width * 0.8, 300);

export type ChatSidebarProps = {
  visible: boolean;
  onClose: () => void;
  sidebarAnim: Animated.Value;
  backdropAnim: Animated.Value;
  onNewChat: () => void;
  loadingSessions: boolean;
  sessions: any[];
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
};

export default function ChatSidebar({
  visible,
  onClose,
  sidebarAnim,
  backdropAnim,
  onNewChat,
  loadingSessions,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.sidebarOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.sidebarBackdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.sidebarContent, { transform: [{ translateX: sidebarAnim }] }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Lịch sử trò chuyện</Text>
            <TouchableOpacity onPress={onNewChat} style={styles.sidebarNewBtn}>
              <MaterialIcons name="add" size={20} color={COLORS.onPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sidebarList}>
            {loadingSessions ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              sessions.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sidebarItem, activeSessionId === s.id && styles.sidebarItemActive]}
                  onPress={() => onSelectSession(s.id)}
                >
                  <View style={styles.sidebarItemTextWrap}>
                    <Text style={[styles.sidebarItemTitle, activeSessionId === s.id && styles.sidebarItemTitleActive]} numberOfLines={1}>
                      {s.title || 'Đoạn chat mới'}
                    </Text>
                    <Text style={styles.sidebarItemDate}>
                      {new Date(s.createdAt || s.CreatedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onDeleteSession(s.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebarContent: {
    width: SIDEBAR_WIDTH, height: '100%', backgroundColor: COLORS.surface,
    paddingTop: 48, shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 10
  },
  sidebarHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant
  },
  sidebarTitle: { ...typography.headlineMd, fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  sidebarNewBtn: { backgroundColor: COLORS.primary, padding: 6, borderRadius: RADIUS.md },
  sidebarList: { flex: 1 },
  sidebarItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant
  },
  sidebarItemActive: { backgroundColor: COLORS.primaryContainer },
  sidebarItemTextWrap: { flex: 1, paddingRight: 8 },
  sidebarItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, marginBottom: 2 },
  sidebarItemTitleActive: { color: COLORS.primary },
  sidebarItemDate: { fontSize: 11, color: COLORS.outline },
});
