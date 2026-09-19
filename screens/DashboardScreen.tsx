import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import BottomTabBar, { TabKey } from '../components/BottomTabBar';

export interface Conversation {
  id: string;
  name: string;
  handle: string;
  lastMessage: string;
  timeAgo: string;
  avatar: string;
  statusColor: string;
}

interface DashboardScreenProps {
  userName: string;
  userId: string;
  userAvatar: string;
  isActive: boolean;
  isScanning: boolean;
  conversations: Conversation[];
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onOpenConversation: (conversation: Conversation) => void;
  onOpenChatCompose: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userName,
  userId,
  userAvatar,
  isActive,
  isScanning,
  conversations,
  activeTab,
  onChangeTab,
  onOpenConversation,
  onOpenChatCompose,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Talkes Dashboard</Text>
       
      </View>

      <View style={styles.body}>
        <View style={styles.profileCard}>
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
          <View style={styles.profileTextWrap}>
            <Text style={styles.profileName}>{userName}</Text>
            <View style={styles.profileMetaRow}>
              <View style={styles.idPill}>
                <Text style={styles.idPillText}>ID: {userId}</Text>
              </View>
              {isActive && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>ACTIVE</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.composeButton}
            onPress={onOpenChatCompose}
          >
            <Text style={styles.composeIcon}>💬</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onChangeTab('nearby')}
          >
            <Text style={styles.quickActionIcon}>👥</Text>
            <Text style={styles.quickActionTitle}>NEARBY</Text>
            <Text style={styles.quickActionSubtitle}>Discover peers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onChangeTab('settings')}
          >
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={styles.quickActionTitle}>SETTINGS</Text>
            <Text style={styles.quickActionSubtitle}>Configuration</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>RECENT CONVERSATIONS</Text>
          {isScanning && (
            <View style={styles.scanningRow}>
              <Text style={styles.scanningDot}>⟳</Text>
              <Text style={styles.scanningText}>Scanning Mesh...</Text>
            </View>
          )}
        </View>

        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationRow}
              onPress={() => onOpenConversation(item)}
            >
              <View>
                <Image
                  source={{ uri: item.avatar }}
                  style={styles.conversationAvatar}
                />
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: item.statusColor },
                  ]}
                />
              </View>
              <View style={styles.conversationTextWrap}>
                <View style={styles.conversationTopRow}>
                  <Text style={styles.conversationName}>{item.name}</Text>
                  <Text style={styles.conversationHandle}>{item.handle}</Text>
                </View>
                <Text style={styles.conversationPreview} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              <View style={styles.conversationRightWrap}>
                <Text style={styles.conversationTime}>{item.timeAgo}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <View style={styles.meshFooter}>
              <Text style={styles.meshFooterTitle}>
                📶 MESH V2.4 SECURED
              </Text>
              <Text style={styles.meshFooterSubtitle}>
                End-to-end encrypted locally. No cloud storage active.
              </Text>
            </View>
          }
        />
      </View>

      <BottomTabBar activeTab={activeTab} onChangeTab={onChangeTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  wifiBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiIcon: { fontSize: 14 },
  body: { flex: 1, paddingHorizontal: spacing.lg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: { width: 48, height: 48, borderRadius: radius.full },
  profileTextWrap: { flex: 1, marginLeft: spacing.sm },
  profileName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  idPill: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  idPillText: { fontSize: 11, color: colors.textSecondary },
  activePill: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  activePillText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  composeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeIcon: { fontSize: 16, color: colors.white },
  quickActionsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  quickActionIcon: { fontSize: 18, marginBottom: spacing.xs },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickActionSubtitle: { fontSize: 12, color: colors.textSecondary },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  scanningRow: { flexDirection: 'row', alignItems: 'center' },
  scanningDot: { fontSize: 12, color: colors.primary, marginRight: 4 },
  scanningText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  listContent: { paddingBottom: spacing.xl },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conversationAvatar: { width: 44, height: 44, borderRadius: radius.full },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.background,
  },
  conversationTextWrap: { flex: 1, marginLeft: spacing.sm },
  conversationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  conversationHandle: { fontSize: 11, color: colors.textMuted },
  conversationPreview: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  conversationRightWrap: { alignItems: 'flex-end' },
  conversationTime: { fontSize: 11, color: colors.textMuted },
  chevron: { fontSize: 18, color: colors.textMuted },
  meshFooter: { alignItems: 'center', marginTop: spacing.xl },
  meshFooterTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  meshFooterSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DashboardScreen;
