import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import BottomTabBar, { TabKey } from '../components/BottomTabBar';

interface SettingsScreenProps {
  userAvatar: string;
  initialDisplayName: string;
  initialDiscoverable?: boolean;
  talkesId: string;
  appVersion: string;
  buildNumber: string;
  protocolVersion: string;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onSaveDisplayName: (name: string) => void;
  onToggleDiscoverability: (enabled: boolean) => void;
  onOpenLowPowerMode: () => void;
  onClearLocalData: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userAvatar,
  initialDisplayName,
  initialDiscoverable,
  talkesId,
  appVersion,
  buildNumber,
  protocolVersion,
  activeTab,
  onChangeTab,
  onSaveDisplayName,
  onToggleDiscoverability,
  onClearLocalData,
}: SettingsScreenProps) => {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [discoverable, setDiscoverable] = useState(
    initialDiscoverable ?? true,
  );

  const handleToggleDiscoverable = (value: boolean) => {
    setDiscoverable(value);
    onToggleDiscoverability(value);
  };

  const confirmClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will remove all chat history and local keys. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: onClearLocalData },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.wifiBadge}>
          <Text style={styles.wifiIcon}>📶</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileBlock}>
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
          <Text style={styles.profileName}>{displayName}</Text>
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedIcon}>✓</Text>
            <Text style={styles.verifiedText}>Verified Local Profile</Text>
          </View>
        </View>

        <Text style={styles.label}>DISPLAY NAME</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            onEndEditing={() => onSaveDisplayName(displayName.trim())}
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <Text style={styles.helperText}>
          Visible to nearby users when discoverable.
        </Text>

        <Text style={[styles.label, styles.labelSpaced]}>YOUR TALKES ID</Text>
        <View style={styles.idRow}>
          <View style={styles.idBox}>
            <Text style={styles.idText}>{talkesId}</Text>
          </View>
          <View style={styles.permanentBadge}>
            <Text style={styles.permanentBadgeText}>PERMANENT</Text>
          </View>
        </View>
        <Text style={styles.helperText}>
          Your unique cryptographic identifier. Cannot be changed.
        </Text>

        <Text style={[styles.label, styles.labelSpaced]}>PREFERENCES</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>🌐</Text>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Discoverability</Text>
              <Text style={styles.settingSubtitle}>
                Allow others to see you nearby
              </Text>
            </View>
            <Switch
              value={discoverable}
              onValueChange={handleToggleDiscoverable}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>APP INFO</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ⓘ About Talkes</Text>
          <Text style={styles.infoText}>
            Talkes is an offline-first, peer-to-peer communication utility.
            Your data never leaves your device except to people you
            explicitly connect with over local mesh networks.
          </Text>
        </View>
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>
            Version {appVersion} (Build {buildNumber})
          </Text>
          <Text style={styles.versionText}>PROTOCOL {protocolVersion}</Text>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerText}>
            Clearing data will remove all chat history and local keys. This
            action cannot be undone.
          </Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={confirmClearData}
          >
            <Text style={styles.dangerButtonText}>🗑 Clear Local Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  profileBlock: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: radius.full },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  verifiedIcon: { fontSize: 11, color: colors.primary, marginRight: 4 },
  verifiedText: { fontSize: 12, color: colors.textSecondary },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  labelSpaced: { marginTop: spacing.lg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm, fontSize: 14 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.textPrimary },
  helperText: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  idBox: {
    flex: 1,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  idText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  permanentBadge: {
    backgroundColor: colors.disabled,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  permanentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  settingsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingIcon: { fontSize: 18, marginRight: spacing.sm },
  settingTextWrap: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  settingSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  settingDivider: { height: 1, backgroundColor: colors.border },
  chevron: { fontSize: 18, color: colors.textMuted },
  infoCard: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  versionText: { fontSize: 11, color: colors.textMuted },
  dangerZone: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: colors.danger },
  dangerText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: { fontSize: 14, fontWeight: '700', color: colors.white },
});

export default SettingsScreen;
