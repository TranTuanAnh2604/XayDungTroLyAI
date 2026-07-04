import React from 'react';
import { StyleSheet, View } from 'react-native';
import AiMessageBubble from './AiMessageBubble';
import SummaryCardMessage from './SummaryCardMessage';
import TypingIndicator from './TypingIndicator';
import UserMessageBubble from './UserMessageBubble';
import ActionMessageBubble from './ActionMessageBubble';
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
            return (
              <ActionMessageBubble
                key={actionMsg.id}
                content={actionMsg.content}
                actionId={actionMsg.actionId}
                appName={actionMsg.appName}
                deepLink={actionMsg.deepLink}
                fallbackUrl={actionMsg.fallbackUrl}
              />
            );
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
