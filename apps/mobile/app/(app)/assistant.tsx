import type { AiMessageDto, AssistantCitationDto } from '@lifeos/shared-types';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, Plus, Send, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  EditorialCard,
  EditorialText,
  ErrorState,
  FilterChip,
  ScreenTopBar,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { intelligenceApi } from '../../src/services/intelligence-api';
import { useTheme } from '../../src/theme';

const SUGGESTED_PROMPTS = [
  'What warranties expire soon?',
  'Summarize my pending tasks',
  'How much do my subscriptions cost?',
  'Which documents are expiring soon?',
] as const;

function routeForCitation(citation: AssistantCitationDto): string {
  switch (citation.entityType) {
    case 'document':
      return `/(app)/documents/${citation.entityId}`;
    case 'asset':
      return `/(app)/assets/${citation.entityId}`;
    case 'task':
    case 'event':
      return '/(app)/(tabs)/calendar';
    case 'subscription':
      return '/(app)/(tabs)/assets';
  }
}

export default function LifeAssistantScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const askMutation = useMutation({
    mutationFn: (question: string) =>
      intelligenceApi.askAssistant({
        conversationId,
        question,
        documentId: documentId ?? null,
      }),
    onSuccess: (res) => {
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
      setErrorText(null);
    },
    onError: (err) => setErrorText(extractApiErrorMessage(err)),
  });

  const handleSend = (text?: string) => {
    const clean = (text ?? draft).trim();
    if (!clean || askMutation.isPending) return;
    if (!text) setDraft('');
    setErrorText(null);
    askMutation.mutate(clean);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background.primary }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.headerPad, { paddingHorizontal: theme.spacing.lg }]}>
          <ScreenTopBar
            onBack={() => router.back()}
            badgeLabel="LifeOS AI"
            badgeTone="violet"
            rightSlot={
              messages.length > 0 ? (
                <Pressable
                  onPress={() => {
                    setConversationId(null);
                    setMessages([]);
                    setErrorText(null);
                  }}
                  style={[
                    styles.newChatBtn,
                    {
                      backgroundColor: theme.colors.expressive.violet.container,
                      borderRadius: theme.shapes.full,
                    },
                  ]}
                >
                  <Plus size={14} color={theme.colors.expressive.violet.onContainer} />
                  <EditorialText variant="caption" tone="violet">
                    New
                  </EditorialText>
                </Pressable>
              ) : null
            }
          />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={{ gap: theme.spacing.md }}>
              <EditorialCard variant="violet" shape="extraLarge">
                <View style={styles.rowGap}>
                  <Sparkles size={20} color={theme.colors.expressive.violet.base} />
                  <EditorialText variant="editorialEyebrow" tone="violetVibrant" uppercase>
                    Grounded Personal Assistant
                  </EditorialText>
                </View>
                <EditorialText variant="headlineMedium" tone="violet" style={{ marginTop: 8 }}>
                  Ask anything about your life records.
                </EditorialText>
                <EditorialText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
                  {documentId
                    ? 'Scoped to your selected document, plus related deadlines and assets.'
                    : 'Answers are strictly grounded in your Vault, Calendar, Assets, and Subscriptions.'}
                </EditorialText>
              </EditorialCard>

              <EditorialText variant="label" tone="secondary">
                Try asking:
              </EditorialText>
              <View style={styles.promptWrap}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <FilterChip
                    key={prompt}
                    label={prompt}
                    accent="violet"
                    selected={false}
                    showCheck={false}
                    onPress={() => handleSend(prompt)}
                  />
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={msg.id}
                  style={[styles.messageWrap, { alignItems: isUser ? 'flex-end' : 'flex-start' }]}
                >
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isUser
                          ? theme.colors.m3.primaryContainer
                          : theme.colors.m3.surfaceContainerLow,
                        borderRadius: theme.shapes.large,
                        borderBottomRightRadius: isUser ? 6 : theme.shapes.large,
                        borderBottomLeftRadius: isUser ? theme.shapes.large : 6,
                      },
                    ]}
                  >
                    {!isUser ? (
                      <View style={[styles.rowGap, { marginBottom: 4 }]}>
                        <Sparkles size={14} color={theme.colors.expressive.violet.base} />
                        <EditorialText variant="caption" tone="violetVibrant">
                          LifeOS AI
                        </EditorialText>
                      </View>
                    ) : null}
                    <EditorialText variant="body" tone={isUser ? 'onPrimaryContainer' : 'primary'}>
                      {msg.content}
                    </EditorialText>

                    {msg.citations.length > 0 ? (
                      <View style={styles.citationsWrap}>
                        {msg.citations.map((cit) => (
                          <Pressable
                            key={`${cit.entityType}-${cit.entityId}`}
                            onPress={() => router.push(routeForCitation(cit) as never)}
                            style={[
                              styles.citationPill,
                              {
                                backgroundColor: theme.colors.m3.surfaceContainerLowest,
                                borderColor: theme.colors.m3.outlineVariant,
                                borderWidth: theme.borderWidths.hairline,
                                borderRadius: theme.shapes.full,
                              },
                            ]}
                          >
                            <FileText size={12} color={theme.colors.m3.primary} />
                            <EditorialText variant="caption" tone="primary" numberOfLines={1}>
                              {cit.title}
                            </EditorialText>
                            <Badge label={cit.entityType} tone="violet" />
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}

          {askMutation.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.m3.primary} />
              <EditorialText variant="caption" tone="muted">
                Checking your personal records...
              </EditorialText>
            </View>
          ) : null}

          {errorText ? <ErrorState message={errorText} /> : null}
        </ScrollView>

        <View
          style={[
            styles.composerOuter,
            {
              backgroundColor: theme.colors.background.primary,
              borderTopColor: theme.colors.m3.outlineVariant,
              borderTopWidth: theme.borderWidths.hairline,
              paddingBottom: Math.max(insets.bottom, 12),
              paddingHorizontal: theme.spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.composerPill,
              {
                backgroundColor: theme.colors.m3.surfaceContainerHigh,
                borderRadius: theme.shapes.full,
              },
            ]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask about a document, warranty, or task..."
              placeholderTextColor={theme.colors.text.muted}
              importantForAutofill="no"
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              style={[
                styles.input,
                {
                  color: theme.colors.m3.onSurface,
                  fontFamily: theme.fonts.bodyRegular,
                  fontSize: theme.typography.body.fontSize,
                },
              ]}
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={!draft.trim() || askMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Send question"
              style={[
                styles.sendBtn,
                {
                  backgroundColor: draft.trim()
                    ? theme.colors.m3.primary
                    : theme.colors.m3.surfaceContainerHighest,
                  borderRadius: theme.shapes.full,
                },
              ]}
            >
              <Send
                size={18}
                color={draft.trim() ? theme.colors.m3.onPrimary : theme.colors.text.muted}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  headerPad: { paddingTop: 12 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  promptWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  messageWrap: {
    width: '100%',
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  citationsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  citationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  composerOuter: {
    paddingTop: 10,
  },
  composerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 6,
    minHeight: 52,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
