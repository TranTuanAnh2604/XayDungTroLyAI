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
  onDismiss?: () => void;
};

export default function ConflictResolutionModal({
  visible,
  mainEvent,
  conflictingEvents,
  serverConflictId,
  onClose,
  onApplySuggestion,
  onDismiss,
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
      onDismiss?.();
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
      console.log(JSON.stringify(response, null, 2));
      console.log('API response:', response);
      console.log('Options:', response?.options);

      let suggestions: any[] = [];
      let introStr = null;

      // Extract detailed explanations if the backend provides a combined explanation string
      let parsedExplanations: string[] = [];
      if (response && typeof response.explanation === 'string') {
        const explanationText = response.explanation;
        const markerRegex = /(?:^|\n)[\s\-*]*(?:\*\*)?(?:(?:Cách|Lựa chọn|Option|Giải pháp|Bước)\s+\d+[:.]?|\d+\.)(?:\*\*)?\s*/gi;
        const matches = [...explanationText.matchAll(markerRegex)];

        if (matches.length > 0) {
          introStr = explanationText.substring(0, matches[0].index).trim() || null;

          for (let i = 0; i < matches.length; i++) {
            const startIdx = matches[i].index + matches[i][0].length;
            const endIdx = i + 1 < matches.length ? matches[i + 1].index : explanationText.length;
            const optText = explanationText.substring(startIdx, endIdx).replace(/\*\*/g, '').trim();
            if (optText) {
              parsedExplanations.push(`Cách ${i + 1}: ${optText}`);
            }
          }
        } else {
          introStr = explanationText;
        }
      }

      if (response && Array.isArray(response.options)) {
        suggestions = response.options.map((option: any, index: number) => ({
          ...option,
          id: option.id || String(index),
          newStart: option.newStart ?? option.suggestedStartTime ?? option.newStartTime,
          newEnd: option.newEnd ?? option.suggestedEndTime ?? option.newEndTime,
          explanation: parsedExplanations[index] || option.reason || `Cách ${index + 1}: Dời ${option.title || 'sự kiện'}`
        }));
      } else if (parsedExplanations.length > 0) {
        suggestions = parsedExplanations.map((exp, index) => ({
          explanation: exp
        }));
      } else if (Array.isArray(response)) {
        suggestions = response;
      }

      console.log('aiResult:', suggestions);

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

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Phát hiện xung đột lịch</Text>

          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.eventsBlock}>
              <Text style={styles.bold}>Sự kiện của bạn:</Text>
              <Text style={styles.eventDetailText}>
                - {mainEvent.title} ({formatTime(mainEvent.startTime)} - {formatTime(mainEvent.endTime)})
              </Text>

              <View style={styles.spacing} />
              <Text style={[styles.bold, { color: COLORS.danger || 'red' }]}>Bị trùng lặp thời gian với:</Text>
              {conflictingEvents.map((evt, idx) => (
                <Text key={idx} style={styles.eventDetailText}>
                  - {evt.title} ({formatTime(evt.startTime)} - {formatTime(evt.endTime)})
                </Text>
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {aiResult && (
              <View style={styles.resultContainer}>
                {aiIntro ? <Text style={styles.aiIntroText}>{aiIntro}</Text> : null}
                <Text style={styles.resultTitle}>Vui lòng chọn một gợi ý:</Text>

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
                      <View style={styles.radioContainer}>
                        <View style={[styles.outerRadio, isSelected && styles.outerRadioSelected]}>
                          {isSelected && <View style={styles.innerRadio} />}
                        </View>
                      </View>
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionExplanation}>{explanation}</Text>
                        {(newStart || newEnd) && (
                          <View style={styles.suggestionTimes}>
                            <Text style={styles.suggestionTimeText}>
                              🕒 Mới: {formatTime(newStart)} - {formatTime(newEnd)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.actionContainer}>
            {aiResult ? (
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
            ) : (
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
                style={[styles.button, styles.secondaryButton, dismissing && styles.buttonDisabled, { marginBottom: 0 }]}
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
    marginBottom: 16,
    textAlign: 'center',
  },
  mainScroll: {
    width: '100%',
    maxHeight: '100%', // Take up available space until actionContainer
    marginBottom: 16,
  },
  mainScrollContent: {
    paddingBottom: 8,
  },
  eventsBlock: {
    padding: 12,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 8,
    marginBottom: 16,
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
    marginBottom: 12,
    fontWeight: 'bold',
  },
  suggestionCard: {
    backgroundColor: COLORS.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  suggestionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryTint10 || '#E0E7FF',
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  outerRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRadioSelected: {
    borderColor: COLORS.primary,
  },
  innerRadio: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  suggestionContent: {
    flex: 1,
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
  actionContainer: {
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
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
