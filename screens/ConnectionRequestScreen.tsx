import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import BottomTabBar, { TabKey } from '../components/BottomTabBar';

interface ConnectionRequestScreenProps {
  requesterName: string;
  requesterId: string;
  requesterAvatar: string;
  distanceLabel: string;
  securityLevel: string;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onBack: () => void;
  onReject: () => void;
  onAccept: () => void;
}

const ConnectionRequestScreen: React.FC<ConnectionRequestScreenProps> = ({
  requesterName,
  requesterId,
  requesterAvatar,
  distanceLabel,
  securityLevel,
  activeTab,
  onChangeTab,
  onBack,
  onReject,
  onAccept,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connection Request</Text>
        <View style={styles.wifiBadge}>
          <Text style={styles.wifiIcon}>📶</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.introBlock}>
          <View style={styles.introIconWrap}>
            <Text style={styles.introIcon}>👤+</Text>
          </View>
          <Text style={styles.introTitle}>New Connection</Text>
          <Text style={styles.introSubtitle}>
            Someone wants to message you locally
          </Text>
        </View>

        <View style={styles.profileCard}>
          <Image source={{ uri: requesterAvatar }} style={styles.avatar} />
          <Text style={styles.requesterName}>{requesterName}</Text>
          <View style={styles.idPill}>
            <Text style={styles.idPillText}>ID: {requesterId}</Text>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📍 Distance</Text>
            <Text style={styles.metaValue}>{distanceLabel}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>🛡️ Security Level</Text>
            <View style={styles.encryptedPill}>
              <Text style={styles.encryptedPillText}>{securityLevel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            ⓘ This user is within range of your local mesh. Accepting allows
            them to see your online status and send messages.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <Text style={styles.rejectButtonText}>✕ Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>✓ Accept</Text>
          </TouchableOpacity>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 24 },
  backIcon: { fontSize: 24, color: colors.textPrimary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  wifiBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiIcon: { fontSize: 14 },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  introBlock: { alignItems: 'center', marginBottom: spacing.lg },
  introIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  introIcon: { fontSize: 20, color: colors.primary },
  introTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  introSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  profileCard: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  requesterName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  idPill: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xs,
  },
  idPillText: { fontSize: 12, color: colors.textSecondary },
  metaBlock: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metaDivider: { height: 1, backgroundColor: colors.border },
  metaLabel: { fontSize: 14, color: colors.textSecondary },
  metaValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  encryptedPill: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  encryptedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  infoBanner: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoBannerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  actionRow: { flexDirection: 'row' },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
});

export default ConnectionRequestScreen;
