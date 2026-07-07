import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Linking, Alert, NativeModules } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import AmbientParticles from '../../components/voice/AmbientParticles';
import AiCoreVisualizer from '../../components/voice/AiCoreVisualizer';
import TranscriptionDisplay from '../../components/voice/TranscriptionDisplay';
import VoiceCommandGrid from '../../components/voice/VoiceCommandGrid';
import VoiceInsightCard from '../../components/voice/VoiceInsightCard';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import { SCROLL_BOTTOM_EXTRA } from '../../constants/layout';
import { VOICE_BRAND, VOICE_COMMANDS, VOICE_INSIGHT } from '../../data/voiceMock';
import type { VoiceCommand } from '../../types/voice';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { chat, markActionExecuted } from '../../services/chat';
import { useTheme } from '../../hooks/useTheme';

type VoiceAssistantScreenProps = {
  onBackToChat?: () => void;
  sessionId?: string;
  onSessionChange?: (id: string) => void;
};

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

const IDLE_HINT = 'Nhấn vào vòng tròn để bắt đầu nói...';



export default function VoiceAssistantScreen({
  onBackToChat,
  sessionId,
  onSessionChange,
}: VoiceAssistantScreenProps) {
  const openSettings = useOpenSettings();
  const { colors: COLORS } = useTheme();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const voiceStateRef = useRef<VoiceState>('idle');
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const [transcript, setTranscript] = useState('');
  const [answerText, setAnswerText] = useState('');
  const activeSessionId = useRef<string | undefined>(sessionId);
  const transcriptRef = useRef('');
  const isProcessingRef = useRef(false);

  useSpeechRecognitionEvent('start', () => {
    console.log('[VoiceAssistantScreen] Event: start');
    setVoiceState('listening');
  });
  useSpeechRecognitionEvent('end', () => {
    console.log('[VoiceAssistantScreen] Event: end');
    const text = transcriptRef.current.trim();
    if (voiceStateRef.current !== 'listening') return;
    
    if (text) {
      handleUserSpeech(text);
    } else {
      setVoiceState('idle');
    }
  });
  useSpeechRecognitionEvent('result', (event) => {
    console.log('[VoiceAssistantScreen] Event: result', event.results[0]?.transcript);
    const text = event.results[0]?.transcript || '';
    transcriptRef.current = text;
    setTranscript(text);
  });
  useSpeechRecognitionEvent('error', (event) => {
    console.log('[VoiceAssistantScreen] Lỗi nhận diện giọng nói:', event.error, event.message);
    setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
    // 'aborted' và 'no-speech' là bình thường, không hiển thị Alert
    if (event.error === 'aborted' || event.error === 'no-speech') return;
    if (event.error === 'client') {
      Alert.alert('Lỗi hệ thống', 'Dịch vụ giọng nói đang gặp sự cố. Hãy cài/cập nhật Google App từ Play Store và thử lại.');
    } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      Alert.alert('Thiếu quyền', 'Chưa cấp quyền microphone hoặc thiết bị không hỗ trợ. Kiểm tra Cài đặt > Ứng dụng.');
    }
  });

  const startListening = useCallback(async () => {
    console.log('[VoiceAssistantScreen] startListening called. Current state:', voiceStateRef.current);
    if (voiceStateRef.current === 'listening') {
      console.log('[VoiceAssistantScreen] Already listening. Ignoring duplicate start.');
      return;
    }
    try {
      // 1. Xin quyền trước (trên một số thiết bị phải có quyền trước khi isRecognitionAvailable trả về đúng)
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      console.log('[VoiceAssistantScreen] Permission status:', permission.granted);
      if (!permission.granted) {
        Alert.alert('Lỗi micro', 'Không thể bật micro. Kiểm tra quyền truy cập trong Cài đặt > Ứng dụng > Hivic AI.');
        return;
      }

      // 2. Kiểm tra service có khả dụng không
      const isAvailable = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      console.log('[VoiceAssistantScreen] isRecognitionAvailable:', isAvailable);
      if (!isAvailable) {
        Alert.alert(
          'Dịch vụ giọng nói chưa sẵn sàng',
          'Thiết bị của bạn chưa cài đặt dịch vụ nhận diện giọng nói (Google App).\n\nHãy cài hoặc cập nhật Google App từ Play Store rồi thử lại.',
          [{ text: 'Đã hiểu', style: 'cancel' }]
        );
        return;
      }
      
      Speech.stop();
      setAnswerText('');
      setTranscript('');
      transcriptRef.current = '';
      isProcessingRef.current = false;
      
      console.log('[VoiceAssistantScreen] Calling ExpoSpeechRecognitionModule.start()...');
      ExpoSpeechRecognitionModule.start({
        lang: 'vi-VN',
        interimResults: true,
        continuous: false,
      });
    } catch (err) {
      console.log('[VoiceAssistantScreen] Lỗi khi bắt đầu ghi âm:', err);
      Alert.alert('Lỗi', 'Không thể khởi động dịch vụ giọng nói.');
    }
  }, []);

  const stopListening = useCallback(async () => {
    console.log('[VoiceAssistantScreen] stopListening called. Current state:', voiceStateRef.current);
    if (voiceStateRef.current !== 'listening') return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      console.log('[VoiceAssistantScreen] Lỗi khi dừng ghi âm:', err);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!text) {
      setVoiceState('idle');
      return;
    }
    setVoiceState('speaking');
    Speech.speak(text, {
      language: 'vi-VN',
      onDone: () => setVoiceState('idle'),
      onStopped: () => setVoiceState('idle'),
      onError: () => setVoiceState('idle'),
    });
  }, []);

  const openApp = useCallback(async (action: {
    actionId: string; deepLink?: string; fallbackUrl: string; appName: string;
  }) => {
    try {
      if (action.deepLink) {
        const canOpen = await Linking.canOpenURL(action.deepLink);
        if (canOpen) {
          await Linking.openURL(action.deepLink);
          await markActionExecuted(action.actionId);
          setVoiceState('idle');
          return;
        }
      }
      await Linking.openURL(action.fallbackUrl);
      await markActionExecuted(action.actionId);
    } catch (err) {
      console.log('Không thể mở app:', err);
    } finally {
      setVoiceState('idle');
    }
  }, []);

  const speakThenExecuteAction = useCallback((
    text: string,
    action: { actionId: string; deepLink?: string; fallbackUrl: string; appName: string },
  ) => {
    setVoiceState('speaking');
    Speech.speak(text, {
      language: 'vi-VN',
      onDone: () => { openApp(action); },
      onStopped: () => { openApp(action); },
      onError: () => { openApp(action); },
    });
  }, [openApp]);

  const handleUserSpeech = useCallback(async (text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setVoiceState('thinking');
    
    try {
      const result = await chat(text, activeSessionId.current);

      if (result.sessionId && result.sessionId !== activeSessionId.current) {
        activeSessionId.current = result.sessionId;
        onSessionChange?.(result.sessionId);
      }

      if (result.kind === 'action') {
        setAnswerText(result.answer);
        speakThenExecuteAction(result.answer, result);
        return;
      }

      setAnswerText(result.answer);
      speak(result.answer);
    } catch (err: any) {
      const msg = err?.message || 'Xin lỗi, mình gặp lỗi kết nối.';
      setAnswerText(msg);
      speak(msg);
    } finally {
      isProcessingRef.current = false;
    }
  }, [onSessionChange, speak, speakThenExecuteAction]);

  const handleMicPress = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'idle' || voiceState === 'error') {
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  const handleCommand = useCallback((command: VoiceCommand) => {
    setTranscript(command.title);
    handleUserSpeech(command.title);
  }, [handleUserSpeech]);

  const listeningLabel =
    voiceState === 'listening' ? 'Đang nghe...'
    : voiceState === 'thinking' ? 'Đang xử lý...'
    : voiceState === 'speaking' ? 'Đang trả lời...'
    : VOICE_BRAND.listeningLabel;

  const displayPhrases = transcript ? [transcript] : [IDLE_HINT];
  const displayHint = answerText || VOICE_BRAND.processingHint;

  return (
    <View style={styles.root}>
      <AmbientParticles />
      <TabScreenLayout
        topBar={
          <TopAppBar
            onSettingsPress={openSettings}
            rightActions={
              onBackToChat ? (
                <MaterialIcons
                  name="chat-bubble"
                  size={24}
                  color={COLORS.primary}
                  onPress={onBackToChat}
                />
              ) : undefined
            }
          />
        }
        bottomExtra={SCROLL_BOTTOM_EXTRA}
        maxContentWidth={448}
        contentContainerStyle={styles.voiceContent}
      >
        <AiCoreVisualizer listeningLabel={listeningLabel} onPress={handleMicPress} />

        <TranscriptionDisplay
          phrases={displayPhrases}
          processingHint={displayHint}
        />

        <VoiceCommandGrid commands={VOICE_COMMANDS} onPress={handleCommand} />
        <VoiceInsightCard insight={VOICE_INSIGHT} />
      </TabScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  voiceContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
});
