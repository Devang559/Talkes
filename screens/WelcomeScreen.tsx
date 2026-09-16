import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

interface WelcomeScreenProps {
  talkesId: string;
  onStartMessaging: (displayName: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  talkesId,
  onStartMessaging,
}) => {
  const [displayName, setDisplayName] = useState('');
  const canStart = displayName.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          {/* Replace with your own illustration asset */}
          <Image
            source={require('../assets/talkes-hero.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Welcome to Talkes</Text>
        <Text style={styles.subtitle}>
          Private, serverless messaging for local mesh communication.
        </Text>

        <FeatureRow
          icon="🛡️"
          title="PRIVACY FIRST"
          description="No servers, no tracking. Your data stays on your device."
        />
        <FeatureRow
          icon="⚡"
          title="OFFLINE DISCOVERY"
          description="Find and chat with nearby peers using Bluetooth and Wi-Fi."
        />

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>DISPLAY NAME</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>
          <Text style={styles.helperText}>
            This is how other nearby users will see you.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldBlock}>
          <View style={styles.idLabelRow}>
            <Text style={styles.label}>YOUR TALKES ID</Text>
            <View style={styles.permanentBadge}>
              <Text style={styles.permanentBadgeText}>PERMANENT</Text>
            </View>
          </View>
          <View style={styles.idBox}>
            <Text style={styles.idText}>{talkesId}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.startButton, canStart && styles.startButtonActive]}
          disabled={!canStart}
          onPress={() => onStartMessaging(displayName.trim())}
        >
          <Text
            style={[
              styles.startButtonText,
              canStart && styles.startButtonTextActive,
            ]}
          >
            START MESSAGING →
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By continuing, you agree that your messages are stored only on this
          device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureRow: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIconWrap}>
      <Text style={styles.featureIcon}>{icon}</Text>
    </View>
    <View style={styles.featureTextWrap}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  heroWrap: {
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  featureIcon: { fontSize: 16 },
  featureTextWrap: { flex: 1 },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  fieldBlock: { marginTop: spacing.md },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  inputIcon: { marginRight: spacing.sm, fontSize: 14 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  idLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permanentBadge: {
    backgroundColor: colors.disabled,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  permanentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  idBox: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  idText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  startButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.disabled,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonActive: {
    backgroundColor: colors.primary,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  startButtonTextActive: {
    color: colors.white,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 17,
  },
});

export default WelcomeScreen;
