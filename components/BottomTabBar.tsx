import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

export type TabKey = 'home' | 'nearby' | 'settings';

interface BottomTabBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '💬' },
  { key: 'nearby', label: 'Nearby', icon: '👥' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChangeTab(tab.key)}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center' },
  icon: { fontSize: 23, opacity: 0.5, marginBottom: 2 },
  iconActive: { opacity: 1 },
  label: { fontSize: 12, color: colors.textMuted },
  labelActive: { color: colors.textPrimary, fontWeight: '700' },
});

export default BottomTabBar;
