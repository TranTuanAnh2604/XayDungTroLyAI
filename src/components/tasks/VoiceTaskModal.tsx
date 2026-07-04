import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, NativeModules,
  View, Animated,
} from 'react-native';
import Voice, {
  type SpeechResultsEvent,
} from '@react-native-voice/voice';
import { voiceTaskApi, type ParsedTask } from '../../services/voicetask';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import { RADIUS } from '../../constants/theme';
import TaskModalContainer from './ui/TaskModalContainer';
import TaskFormLayout from './ui/TaskFormLayout';
import TaskFormFields from './ui/TaskFormFields';

type VoiceState = 'idle' | 'listening' | 'processing' | 'preview' | 'error';

const isVoiceNativeModuleAvailable = !!(NativeModules.Voice || NativeModules.RNVoice);

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function VoiceTaskModal({ visible, onClose, onSaved }: Props) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const s = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedTask | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const transcriptRef = useRef('');
  const voiceStateRef = useRef<VoiceState>('idle');
  const isProcessingRef = useRef(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const handleParse = useCallback(async (text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setVoiceState('processing');
    try {
      const result = await voiceTaskApi.parse(text);
      setParsed(result);
      setVoiceState('preview');
    } catch (err: any) {
      setErrorMsg('AI không thể phân tích. Hãy thử nói lại rõ hơn!');
      setVoiceState('error');
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (voiceState === 'listening') {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 650, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [voiceState, pulseAnim]);

  const handleParseRef = useRef(handleParse);
  useEffect(() => {
    handleParseRef.current = handleParse;
  }, [handleParse]);

  useEffect(() => {
    if (!visible || !Voice || !isVoiceNativeModuleAvailable) return;
    if (Voice.isAvailable) {
      Voice.isAvailable().catch(console.error);
    }
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0] ?? '';
      transcriptRef.current = text;
      setTranscript(text);
    };
    Voice.onSpeechEnd = () => {
      if (Platform.OS === 'ios') {
        const text = transcriptRef.current.trim();
        if (voiceStateRef.current !== 'listening') return;
        if (text) {
          handleParseRef.current(text);
        } else {
          setVoiceState('idle');
        }
      }
    };
    return () => {
      if (Voice && isVoiceNativeModuleAvailable) {
        Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
      }
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) resetAll();
  }, [visible]);

  const resetAll = async () => {
    if (Voice && isVoiceNativeModuleAvailable) {
      try { await Voice.cancel(); } catch {}
    }
    isProcessingRef.current = false;
    transcriptRef.current = '';
    setVoiceState('idle');
    setTranscript('');
    setParsed(null);
    setErrorMsg('');
  };

  const handleStartListening = async () => {
    if (!Voice || !isVoiceNativeModuleAvailable) {
      setErrorMsg('Nhận diện giọng nói không khả dụng trên thiết bị này.');
      setVoiceState('error');
      return;
    }
    await resetAll();
    try {
      setVoiceState('listening');
      await Voice.start('vi-VN');
    } catch (e) {
      setErrorMsg('Không thể bắt đầu ghi âm. Kiểm tra quyền microphone!');
      setVoiceState('error');
    }
  };

  const handleStopListening = async () => {
    if (voiceStateRef.current !== 'listening') return;
    if (Voice && isVoiceNativeModuleAvailable) {
      try { await Voice.stop(); } catch (e) {}
    }
    if (Platform.OS === 'android') {
      setTimeout(() => {
        const text = transcriptRef.current.trim();
        if (voiceStateRef.current !== 'listening') return;
        if (text) {
          handleParseRef.current(text);
        } else {
          setVoiceState('idle');
        }
      }, 300);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setIsSaving(true);
    try {
      await voiceTaskApi.save(parsed);
      onSaved();
      onClose();
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu công việc, thử lại!');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBody = () => {
    switch (voiceState) {
      case 'idle':
        return (
          <View style={s.centerBlock}>
            <Text style={s.hint}>Nói tên công việc bạn cần làm</Text>
            <Text style={s.example}>💡 "Họp nhóm thứ 2, quan trọng"</Text>
            <TouchableOpacity style={s.micBtn} onPress={handleStartListening} activeOpacity={0.8}>
              <Text style={s.micIcon}>🎙️</Text>
            </TouchableOpacity>
            <Text style={s.tapHint}>Nhấn để bắt đầu</Text>
          </View>
        );

      case 'listening':
        return (
          <View style={s.centerBlock}>
            <Text style={s.listeningLabel}>🔴 Đang nghe...</Text>
            <View style={s.transcriptBox}>
              <Text style={s.transcriptText}>
                {transcript || 'Hãy nói công việc cần làm...'}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={s.micBtnStop} onPress={handleStopListening} activeOpacity={0.8}>
                <Text style={s.micIcon}>⏹️</Text>
              </TouchableOpacity>
            </Animated.View>
            <Text style={s.tapHint}>Nhấn để dừng</Text>
          </View>
        );

      case 'processing':
        return (
          <View style={s.centerBlock}>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 16 }} />
            <Text style={s.loadingText}>AI đang phân tích ý định của bạn...</Text>
          </View>
        );

      case 'preview':
        if (!parsed) return null;
        return (
          <TaskFormFields
            data={{
              title: parsed.title,
              description: parsed.description || '',
              type: parsed.type,
              priority: parsed.priority > 0 ? 'high' : 'normal',
              dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
            }}
            onChange={(updates) => {
              setParsed((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  title: updates.title ?? prev.title,
                  description: updates.description ?? prev.description,
                  type: updates.type ?? prev.type,
                  priority: updates.priority !== undefined ? (updates.priority === 'high' ? 1 : 0) : prev.priority,
                  dueDate: updates.dueDate !== undefined ? (updates.dueDate ? updates.dueDate.toISOString() : null) : prev.dueDate,
                };
              });
            }}
          />
        );

      case 'error':
        return (
          <View style={s.centerBlock}>
            <Text style={s.errorIcon}>⚠️</Text>
            <Text style={s.errorText}>{errorMsg}</Text>
          </View>
        );
    }
  };

  const renderFooter = () => {
    if (voiceState === 'preview') {
      return (
        <View style={s.actionRow}>
          <TouchableOpacity style={s.retryBtn} onPress={resetAll}>
            <Text style={s.retryText}>Nói lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={COLORS.onPrimary} size="small" />
            ) : (
              <Text style={s.saveText}>Lưu ngay</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    if (voiceState === 'error') {
      return (
        <TouchableOpacity style={s.retryBtn} onPress={resetAll}>
          <Text style={s.retryText}>Thử lại</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <TaskModalContainer visible={visible} onClose={onClose}>
      <TaskFormLayout
        title={voiceState === 'preview' ? 'Xác nhận công việc' : 'Nhập bằng giọng nói'}
        footer={renderFooter()}
      >
        {renderBody()}
      </TaskFormLayout>
    </TaskModalContainer>
  );
}

const createStyles = (COLORS: any, typography: any) =>
  StyleSheet.create({
    centerBlock: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    hint: { ...typography.bodyLg, color: COLORS.onSurface, fontWeight: '600', marginBottom: 8 },
    example: { ...typography.bodyMd, color: COLORS.textSecondary, marginBottom: 32 },
    micBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, marginBottom: 16 },
    micIcon: { fontSize: 32 },
    tapHint: { ...typography.bodySm, color: COLORS.textSecondary },
    listeningLabel: { ...typography.bodyLg, color: COLORS.error, fontWeight: '700', marginBottom: 16 },
    transcriptBox: { width: '100%', padding: 16, backgroundColor: COLORS.surfaceVariant, borderRadius: RADIUS.md, marginBottom: 32, minHeight: 80, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.primary}4D` },
    transcriptText: { ...typography.bodyLg, color: COLORS.onSurface, textAlign: 'center', fontStyle: 'italic' },
    micBtnStop: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, marginBottom: 16 },
    loadingText: { ...typography.bodyMd, color: COLORS.textSecondary, fontStyle: 'italic' },
    errorIcon: { fontSize: 48, marginBottom: 16 },
    errorText: { ...typography.bodyLg, color: COLORS.error, textAlign: 'center', marginBottom: 24, paddingHorizontal: 16 },
    
    actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
    retryBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceVariant, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
    retryText: { ...typography.bodyLg, color: COLORS.onSurface, fontWeight: '600' },
    saveBtn: { flex: 2, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    saveText: { ...typography.bodyLg, color: COLORS.onPrimary, fontWeight: '700' },
  });
