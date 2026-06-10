import React, { useState } from 'react';
import ChatScreen from '../screens/chat/ChatScreen';
import VoiceAssistantScreen from '../screens/voice/VoiceAssistantScreen';

export default function ChatNavigator() {
  const [mode, setMode] = useState<'text' | 'voice'>('text');

  if (mode === 'voice') {
    return <VoiceAssistantScreen onBackToChat={() => setMode('text')} />;
  }

  return <ChatScreen onOpenVoice={() => setMode('voice')} />;
}
