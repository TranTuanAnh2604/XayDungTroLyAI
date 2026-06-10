import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AmbientParticles from '../../components/voice/AmbientParticles';
import AiCoreVisualizer from '../../components/voice/AiCoreVisualizer';
import TranscriptionDisplay from '../../components/voice/TranscriptionDisplay';
import VoiceCommandGrid from '../../components/voice/VoiceCommandGrid';
import VoiceInsightCard from '../../components/voice/VoiceInsightCard';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import { SCROLL_BOTTOM_EXTRA } from '../../constants/layout';
import {
  TRANSCRIPTION_PHRASES,
  VOICE_BRAND,
  VOICE_COMMANDS,
  VOICE_INSIGHT,
} from '../../data/voiceMock';
import { COLORS } from '../../constants/theme';
import type { VoiceCommand } from '../../types/voice';
import { useOpenSettings } from '../../hooks/useOpenSettings';

type VoiceAssistantScreenProps = {
  onBackToChat?: () => void;
};

export default function VoiceAssistantScreen({
  onBackToChat,
}: VoiceAssistantScreenProps) {
  const openSettings = useOpenSettings();

  const handleCommand = useCallback((_command: VoiceCommand) => {
    // TODO: route voice intent
  }, []);

  return (
    <View style={styles.root}>
      <AmbientParticles />
      <TabScreenLayout
        topBar={
          <TopAppBar
            onSettingsPress={openSettings}
            rightActions={
              onBackToChat ? (
                <Pressable
                  onPress={onBackToChat}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Quay lại chat văn bản"
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <MaterialIcons
                    name="chat-bubble"
                    size={24}
                    color={COLORS.primary}
                  />
                </Pressable>
              ) : undefined
            }
          />
        }
        bottomExtra={SCROLL_BOTTOM_EXTRA}
        maxContentWidth={448}
        contentContainerStyle={styles.voiceContent}
      >
        <AiCoreVisualizer listeningLabel={VOICE_BRAND.listeningLabel} />
        <TranscriptionDisplay
          phrases={TRANSCRIPTION_PHRASES}
          processingHint={VOICE_BRAND.processingHint}
        />
        <VoiceCommandGrid commands={VOICE_COMMANDS} onPress={handleCommand} />
        <VoiceInsightCard insight={VOICE_INSIGHT} />
      </TabScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  voiceContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
