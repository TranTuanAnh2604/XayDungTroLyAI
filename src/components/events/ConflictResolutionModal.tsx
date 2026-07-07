import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import { aiSuggestConflict, resolveCalendarConflict } from '../../services/sync';
import type { CalendarSyncRequest } from '../../services/sync';

type ConflictResolutionModalProps = {
  visible: boolean;
  mainEvent: CalendarSyncRequest | null;
  conflictingEvents: CalendarSyncRequest[];
  serverConflictId?: string | null;
  onClose: () => void;
  onApplySuggestion: (suggestion: any) => Promise<void>;
};

export default function ConflictResolutionModal({
  visible,
  mainEvent,
  conflictingEvents,
  serverConflictId,
  onClose,
  onApplySuggestion,
}: ConflictResolutionModalProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);

  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [aiResult, setAiResult] = useState<any[] | null>(null);
  const [aiIntro, setAiIntro] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const [matchedConflictId, setMatchedConflictId] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setLoading(false);
      setApplying(false);
      setAiResult(null);
      setAiIntro(null);
      setError(null);
      setSelectedSuggestionIndex(null);
      setMatchedConflictId(null);
    }
  }, [visible]);

  if (!mainEvent) return null;

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      const idToResolve = matchedConflictId || serverConflictId;
      if (idToResolve) {
        await resolveCalendarConflict(idToResolve, 'keep_device');
      }
    } catch (err) {
      console.warn('[conflict-modal] Failed to resolve conflict on dismiss:', err);
      // Không chặn người dùng đóng modal dù resolve lỗi
    } finally {
      setDismissing(false);
      onClose();
    }
  };

  const handleAiSuggest = async () => {
    if (!mainEvent.id) {
      setError('Sự kiện không có ID hợp lệ để gọi AI.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let debugServerConflicts: any = null;
      let debugEid: string | null = null;
      let targetId = serverConflictId;

      if (!targetId) {
        console.log(`[conflict-modal] serverConflictId is missing, fetching from server...`);
        try {
          const { getCalendarConflicts } = require('../../services/sync');
          const serverConflicts = await getCalendarConflicts();
          debugServerConflicts = serverConflicts;
          console.log('[conflict-modal] Available server conflicts:', JSON.stringify(serverConflicts));

          const eid = mainEvent.id ? String(mainEvent.id) : '';
          debugEid = eid;
          const matchingConflict = serverConflicts.find((c: any) => {
            if (!c) return false;
            // Match by IDs if available (convert to string to avoid int/string mismatch)
            if (eid && (
              String(c.eventId) === eid || String(c.EventId) === eid ||
              String(c.conflictingEventId) === eid || String(c.ConflictingEventId) === eid ||
              String(c.mainEventId) === eid || String(c.MainEventId) === eid ||
              String(c.eventAId) === eid || String(c.EventAId) === eid || String(c.event_a_id) === eid ||
              String(c.eventBId) === eid || String(c.EventBId) === eid || String(c.event_b_id) === eid ||
              (c.deviceEvent && String(c.deviceEvent.id) === eid) ||
              (c.serverEvent && String(c.serverEvent.id) === eid) ||
              (c.EventA && String(c.EventA.id) === eid) ||
              (c.EventB && String(c.EventB.id) === eid) ||
              (c.eventA && String(c.eventA.id) === eid) ||
              (c.eventB && String(c.eventB.id) === eid) ||
              c.event_a_id === eid || c.eventAId === eid ||
              c.event_b_id === eid || c.eventBId === eid ||
              c.EventAId === eid || c.EventBId === eid
            )) {
              return true;
            }
            // Match by title
            if (c.title === mainEvent.title || c.Title === mainEvent.title) return true;
            if (c.deviceEvent && c.deviceEvent.title === mainEvent.title) return true;
            if (c.serverEvent && c.serverEvent.title === mainEvent.title) return true;
            if (c.eventA && c.eventA.title === mainEvent.title) return true;
            if (c.eventB && c.eventB.title === mainEvent.title) return true;
            if (c.EventA && c.EventA.title === mainEvent.title) return true;
            if (c.EventB && c.EventB.title === mainEvent.title) return true;

            return false;
          });

          if (matchingConflict) {
            targetId = matchingConflict.id || matchingConflict.Id;
            console.log(`[conflict-modal] Found matching Conflict ID: ${targetId}`);
          }
        } catch (e) {
          console.warn('[conflict-modal] Failed to fetch server conflicts', e);
        }
      }

      if (!targetId) {
        throw new Error(`Không tìm thấy ID: ${debugEid}. Data: ${JSON.stringify(debugServerConflicts)}`);
      }

      setMatchedConflictId(targetId);

      console.log(`Calling AI Suggest API with ConflictID: ${targetId}`);

      const response = await aiSuggestConflict(targetId);
      console.log(`Response:\n`, response);

      let suggestions = [];
      let introStr = null;

      if (response && response.suggestion && typeof response.suggestion === 'string') {
        const suggestionText = response.suggestion;
        // Split by newlines followed by a number, a dot, and optionally markdown bold
        const optionsStr = suggestionText.split(/\n\d+\.\s+(?:\*\*)?/);

        if (optionsStr.length > 1) {
          introStr = optionsStr[0].trim();

          for (let i = 1; i < optionsStr.length; i++) {
            const optText = optionsStr[i].replace(/\*\*/g, '').trim();
            const explanation = `Cách ${i}: ${optText}`;

            let newStart = undefined;
            let newEnd = undefined;

            // Match HH:mm - HH:mm or HH:mm đến HH:mm
            const timeMatch = optText.match(/(\d{1,2}:\d{2})\s*(?:-|–|đến)\s*(\d{1,2}:\d{2})/);
            if (timeMatch) {
              const startDate = new Date(mainEvent.startTime);
              const endDate = new Date(mainEvent.endTime);

              const [sH, sM] = timeMatch[1].split(':');
              startDate.setHours(parseInt(sH, 10), parseInt(sM, 10), 0, 0);
              newStart = startDate.toISOString();

              const [eH, eM] = timeMatch[2].split(':');
              endDate.setHours(parseInt(eH, 10), parseInt(eM, 10), 0, 0);
              newEnd = endDate.toISOString();
            }

            suggestions.push({
              explanation,
              suggestedStartTime: newStart,
              suggestedEndTime: newEnd
            });
          }
        } else {
          suggestions = [{ explanation: suggestionText }];
        }
      } else if (Array.isArray(response)) {
        suggestions = response;
      } else if (response && typeof response === 'object') {
        if (response.data && Array.isArray(response.data)) {
          suggestions = response.data;
        } else {
          suggestions = [response];
        }
      } else if (typeof response === 'string') {
        suggestions = [{ explanation: response }];
      }

      setAiIntro(introStr);
      setAiResult(suggestions);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi gọi máy chủ AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (selectedSuggestionIndex === null || !aiResult) return;
    setApplying(true);
    try {
      await onApplySuggestion(aiResult[selectedSuggestionIndex]);

      const idToResolve = matchedConflictId || serverConflictId;
      if (idToResolve) {
        try {
          await resolveCalendarConflict(idToResolve, 'keep_device');
          console.log(`[conflict-modal] Resolved conflict on server: ${idToResolve}`);
        } catch (resErr) {
          console.warn('[conflict-modal] Failed to resolve conflict on apply:', resErr);
        }
      }
    } finally {
      setApplying(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderSuggestions = () => {
    if (!aiResult || aiResult.length === 0) {
      return (
        <View style={styles.resultContainer}>
          {aiIntro && <Text style={styles.aiIntroText}>{aiIntro}</Text>}
          <Text style={styles.resultText}>Không có gợi ý nào từ AI.</Text>
        </View>
      );
    }

    return (
      <View style={styles.resultContainer}>
        {aiIntro && <Text style={styles.aiIntroText}>{aiIntro}</Text>}
        <Text style={styles.resultTitle}>Vui lòng chọn một gợi ý:</Text>
        <ScrollView style={styles.scrollableResult} nestedScrollEnabled>
          {aiResult.map((item, index) => {
            const isSelected = selectedSuggestionIndex === index;
            const explanation = item.explanation || item.message || item.reason || (typeof item === 'string' ? item : JSON.stringify(item));
            const newStart = item.suggestedStartTime || item.newStartTime;
            const newEnd = item.suggestedEndTime || item.newEndTime;

            return (
              <Pressable
                key={index}
                style={[styles.suggestionCard, isSelected && styles.suggestionCardSelected]}
                onPress={() => setSelectedSuggestionIndex(index)}
              >
                <Text style={styles.suggestionExplanation}>{explanation}</Text>
                {(newStart || newEnd) && (
                  <View style={styles.suggestionTimes}>
                    <Text style={styles.suggestionTimeText}>
                      🕒 Mới: {formatTime(newStart)} - {formatTime(newEnd)}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          onPress={handleApply}
          style={[styles.button, styles.primaryButton, (applying || selectedSuggestionIndex === null) && styles.buttonDisabled]}
          disabled={applying || selectedSuggestionIndex === null}
        >
          {applying ? (
            <ActivityIndicator color={COLORS.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Áp dụng gợi ý đã chọn</Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Phát hiện xung đột lịch</Text>

          <ScrollView style={styles.eventsScroll}>
            <Text style={styles.bold}>Sự kiện của bạn:</Text>
            <Text style={styles.eventDetailText}>- {mainEvent.title} ({formatTime(mainEvent.startTime)} - {formatTime(mainEvent.endTime)})</Text>

            <View style={styles.spacing} />
            <Text style={[styles.bold, { color: COLORS.danger || 'red' }]}>Bị trùng lặp thời gian với:</Text>
            {conflictingEvents.map((evt, idx) => (
              <Text key={idx} style={styles.eventDetailText}>
                - {evt.title} ({formatTime(evt.startTime)} - {formatTime(evt.endTime)})
              </Text>
            ))}
          </ScrollView>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {aiResult ? renderSuggestions() : (
            <Pressable
              onPress={handleAiSuggest}
              style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>AI gợi ý xử lý</Text>
              )}
            </Pressable>
          )}

          {!applying && (
            <Pressable
              onPress={handleDismiss}
              disabled={dismissing}
              style={[styles.button, styles.secondaryButton, dismissing && styles.buttonDisabled]}
            >
              {dismissing ? (
                <ActivityIndicator color={COLORS.onSurface} />
              ) : (
                <Text style={styles.secondaryButtonText}>Bỏ qua (Giữ nguyên)</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...typography.headlineSm,
    color: COLORS.onSurface,
    marginBottom: 12,
    textAlign: 'center',
  },
  eventsScroll: {
    maxHeight: 150,
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 8,
  },
  spacing: {
    height: 12,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  eventDetailText: {
    ...typography.bodySm,
    color: COLORS.onSurfaceVariant,
  },
  errorText: {
    ...typography.bodyMd,
    color: COLORS.danger || 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  aiIntroText: {
    ...typography.bodySm,
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  resultTitle: {
    ...typography.labelLg,
    color: COLORS.onSurface,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  scrollableResult: {
    maxHeight: 200,
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: COLORS.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryTint10 || '#E0E7FF',
  },
  suggestionExplanation: {
    ...typography.bodySm,
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  suggestionTimes: {
    marginTop: 4,
  },
  suggestionTimeText: {
    ...typography.labelSm,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  resultText: {
    ...typography.bodySm,
    color: COLORS.onSurface,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    ...typography.labelLg,
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  secondaryButtonText: {
    ...typography.labelLg,
    color: COLORS.onSurface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
