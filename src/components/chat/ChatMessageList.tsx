import React from 'react';
import { StyleSheet, View } from 'react-native';
import AiMessageBubble from './AiMessageBubble';
import SummaryCardMessage from './SummaryCardMessage';
import TypingIndicator from './TypingIndicator';
import UserMessageBubble from './UserMessageBubble';
import type { ChatMessage, ChatActionMessage } from '../../types/chat';

type ChatMessageListProps = {
  messages: ChatMessage[];
};

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <View style={styles.list}>
      {messages.map((message) => {
        switch (message.role) {
          case 'ai':
            return <AiMessageBubble key={message.id} content={message.content} />;
          case 'user':
            return <UserMessageBubble key={message.id} content={message.content} />;
          case 'summary':
            return <SummaryCardMessage key={message.id} message={message} />;
          case 'typing':
            return <TypingIndicator key={message.id} />;
          case 'action':
            const actionMsg = message as ChatActionMessage;
            return <AiMessageBubble key={actionMsg.id} content={actionMsg.content} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
});
