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

export interface Peer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  signalColor: string;
  status: 'connect' | 'active';
}

interface NearbyDiscoveryScreenProps {
  isScanning: boolean;
  isAdvertising: boolean;
  isPermissionGranted: boolean;
  radiusMeters: number;
  peers: Peer[];
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onConnect: (peer: Peer) => void;
  onSearch: () => void;
  onToggleAdvertising: () => void;
  onRequestPermissions: () => void;
  onBack?: () => void;
}

const NearbyDiscoveryScreen: React.FC<NearbyDiscoveryScreenProps> = ({
  isScanning,
  isAdvertising,
  isPermissionGranted,
  radiusMeters,
  peers,
  activeTab,
  onChangeTab,
  onConnect,
  onSearch,
  onToggleAdvertising,
  onRequestPermissions,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Discovery</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.scanningBlock}>
          <View style={styles.scanningIconOuter}>
            <View style={styles.scanningIconInner}>
              <Text style={styles.scanningIcon}>◎</Text>
            </View>
          </View>
          <Text style={styles.scanningTitle}>
            {isScanning ? 'Scanning Mesh Network' : 'Scan Paused'}
          </Text>
          <Text style={styles.scanningSubtitle}>
            Searching for Talkes users within {radiusMeters} meters of your
            current location.
          </Text>
          {!isPermissionGranted && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={onRequestPermissions}
            >
              <Text style={styles.permissionButtonText}>
                Enable Bluetooth & Location Permissions
              </Text>
            </TouchableOpacity>
          )}
          {isPermissionGranted && (
            <TouchableOpacity
              style={[
                styles.visibilityToggle,
                isAdvertising && styles.visibilityToggleActive,
              ]}
              onPress={onToggleAdvertising}
            >
              <Text style={styles.visibilityToggleText}>
                {isAdvertising ? 'Listening' : 'Not Listening'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.foundRow}>
          <View style={styles.foundPill}>
            <Text style={styles.foundPillText}>
              {peers.length} PEERS FOUND
            </Text>
          </View>
          <TouchableOpacity onPress={onSearch}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={peers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.peerRow}>
              <View>
                <Image source={{ uri: item.avatar }} style={styles.peerAvatar} />
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: item.signalColor },
                  ]}
                />
              </View>
              <View style={styles.peerTextWrap}>
                <Text style={styles.peerName}>{item.name}</Text>
                <Text style={styles.peerHandle}>{item.handle}</Text>
              </View>
              {item.status === 'active' ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>✓ Active</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => onConnect(item)}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListFooterComponent={
            <View style={styles.privacyNotice}>
              <Text style={styles.privacyNoticeTitle}>
                📶 PRIVACY NOTICE
              </Text>
              <Text style={styles.privacyNoticeText}>
                Discovery uses Bluetooth Low Energy (BLE) and Wi-Fi Direct.
                Your Talkes ID is only visible to users currently in
                'Discoverable' mode.
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
  body: { flex: 1, paddingHorizontal: spacing.lg },
  scanningBlock: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  scanningIconOuter: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  scanningIconInner: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningIcon: { fontSize: 22, color: colors.white },
  visibilityToggle: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
  },
  visibilityToggleActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  visibilityToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  permissionButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  scanningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  scanningSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  foundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  foundPill: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  foundPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  searchIcon: { fontSize: 16 },
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  peerAvatar: { width: 48, height: 48, borderRadius: radius.full },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.background,
  },
  peerTextWrap: { flex: 1, marginLeft: spacing.sm },
  peerName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  peerHandle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  activeBadge: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  activeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  privacyNotice: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  privacyNoticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  privacyNoticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});

export default NearbyDiscoveryScreen;
