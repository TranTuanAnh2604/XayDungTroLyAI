import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Linking, Alert, NativeModules } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
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

const isVoiceNativeModuleAvailable = !!(NativeModules.Voice || NativeModules.RNVoice);

export default function VoiceAssistantScreen({
  onBackToChat,
  sessionId,
  onSessionChange,
}: VoiceAssistantScreenProps) {
  const openSettings = useOpenSettings();
  const { colors: COLORS } = useTheme();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [answerText, setAnswerText] = useState('');
  const activeSessionId = useRef<string | undefined>(sessionId);

  useEffect(() => {
    if (!Voice || !isVoiceNativeModuleAvailable) return;

    Voice.onSpeechStart = () => setVoiceState('listening');
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0]?.trim();
      if (text) {
        setTranscript(text);
        handleUserSpeech(text);
      } else {
        setVoiceState('idle');
      }
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.log('Lỗi nhận diện giọng nói:', e.error);
      setVoiceState('idle');
    };

    return () => {
      if (Voice && isVoiceNativeModuleAvailable && Voice.destroy) {
        Voice.destroy().then(() => {
          if (Voice.removeAllListeners) {
            Voice.removeAllListeners();
          }
        }).catch(console.error);
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!Voice || !isVoiceNativeModuleAvailable) {
      Alert.alert('Lỗi micro', 'Nhận diện giọng nói không khả dụng trên thiết bị này.');
      return;
    }
    try {
      Speech.stop();
      setAnswerText('');
      setTranscript('');
      await Voice.start('vi-VN');
      setVoiceState('listening');
    } catch (err) {
      console.log('Không thể bắt đầu ghi âm:', err);
      Alert.alert('Lỗi micro', 'Không thể bật micro. Kiểm tra quyền truy cập trong Cài đặt.');
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!Voice || !isVoiceNativeModuleAvailable) return;
    try {
      await Voice.stop();
    } catch (err) {
      console.log('Lỗi khi dừng ghi âm:', err);
    }
  }, []);

  const handleUserSpeech = useCallback(async (text: string) => {
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
    }
  }, [onSessionChange]);

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
