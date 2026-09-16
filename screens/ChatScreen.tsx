import React, { useState } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import BottomTabBar, { TabKey } from '../components/BottomTabBar';

export interface Message {
  id: string;
  text: string;
  time: string;
  isMine: boolean;
  isRead?: boolean;
}

interface ChatScreenProps {
  peerName: string;
  peerId?: string;
  peerAvatar: string;
  isOnline: boolean;
  dateLabel: string;
  messages: Message[];
  networkStatus: string;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onBack: () => void;
  onSend: (text: string) => void;
  onOpenMenu: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  peerName,
  peerId,
  peerAvatar,
  isOnline,
  dateLabel,
  messages,
  networkStatus,
  activeTab,
  onChangeTab,
  onBack,
  onSend,
  onOpenMenu,
}) => {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    if (!draft.trim() || !isOnline) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <><StatusBar hidden={true} /><SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{peerName}</Text>
        <View style={styles.wifiBadge}>
          <Text style={styles.wifiIcon}>📶</Text>
        </View>
      </View>

      <View style={styles.peerBar}>
        <Image source={{ uri: peerAvatar }} style={styles.peerAvatar} />
        <View style={styles.peerTextWrap}>
          <Text style={styles.peerName}>{peerName.toLowerCase()}</Text>
          <Text style={styles.peerStatus}>
            {isOnline ? 'Connected via Mesh' : 'Offline'}
          </Text>
          {peerId ? (
            <Text style={styles.peerId}>ID: {peerId}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={onOpenMenu}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={<View style={styles.dateChipWrap}>
            <View style={styles.dateChip}>
              <Text style={styles.dateChipText}>{dateLabel}</Text>
            </View>
          </View>}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubbleRow,
                item.isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  item.isMine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    item.isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
              <Text
                style={[
                  styles.timeText,
                  item.isMine ? styles.timeTextRight : styles.timeTextLeft,
                ]}
              >
                {item.time} {item.isMine && item.isRead ? '✓✓' : ''}
              </Text>
            </View>
          )} />

        <View style={styles.networkStatusWrap}>
          <Text style={styles.networkStatusText}>{networkStatus}</Text>
        </View>

        <View style={styles.composerRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.composerInput}
            placeholder="Secure local message..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline />
        
          <TouchableOpacity
            style={[styles.sendButton, !isOnline && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!isOnline}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.bottomTabBarWrap}>
        <BottomTabBar activeTab={activeTab} onChangeTab={onChangeTab} />
      </View>
    </SafeAreaView></>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flexOne: { flex: 1 },
  bottomTabBarWrap: {
    flexShrink: 0,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 24 },
  backIcon: { fontSize: 35, color: colors.textPrimary },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary,top: 2 },
  wifiBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiIcon: { fontSize: 14 },
  peerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  peerAvatar: { width: 36, height: 36, borderRadius: radius.full },
  peerTextWrap: { flex: 1, marginLeft: spacing.sm },
  peerName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  peerStatus: { fontSize: 11, color: colors.textMuted },
  peerId: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  menuIcon: { fontSize: 18, color: colors.textSecondary },
  messagesList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  dateChipWrap: { alignItems: 'center', marginBottom: spacing.md },
  dateChip: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  dateChipText: { fontSize: 11, color: colors.textSecondary },
  bubbleRow: { marginBottom: spacing.sm, maxWidth: '80%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.cardMuted, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: colors.white },
  bubbleTextTheirs: { color: colors.textPrimary },
  timeText: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  timeTextRight: { textAlign: 'right' },
  timeTextLeft: { textAlign: 'left' },
  networkStatusWrap: { alignItems: 'center', paddingBottom: spacing.xs },
  networkStatusText: { fontSize: 11, color: colors.textMuted },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  attachButton: { padding: spacing.xs },
  attachIcon: { fontSize: 18 },
  composerInput: {
    flex: 1,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginHorizontal: spacing.xs,
    maxHeight: 100,
  },
  emojiButton: { padding: spacing.xs },
  emojiIcon: { fontSize: 18 },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  sendIcon: { fontSize: 14, color: colors.white },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
});

export default ChatScreen;
