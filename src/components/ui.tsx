import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

export function Screen({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View style={styles.frame}>{children}</View>
    </SafeAreaView>
  );
}

export function Display({
  children,
  size = 28,
  color = colors.text,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[{ fontFamily: fonts.display, fontSize: size, color, textAlign: 'center' }, style]}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  center,
  muted,
  small,
}: {
  children: ReactNode;
  center?: boolean;
  muted?: boolean;
  small?: boolean;
}) {
  return (
    <Text
      style={{
        color: muted ? colors.muted : colors.text,
        fontSize: small ? 11 : 13,
        letterSpacing: 0.6,
        textAlign: center ? 'center' : 'left',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

export function IconButton({
  label,
  onPress,
  size = 28,
}: {
  label: string;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.iconBtn}>
      <Text style={{ color: colors.text, fontSize: size, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  color = colors.green,
  disabled,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primary, { opacity: disabled ? 0.4 : 1 }]}
    >
      <Text style={[styles.primaryText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function PanelButton({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.panel, active && styles.panelActive]}>
      <Text style={styles.panelText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    paddingHorizontal: 14,
  },
  iconBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  primaryText: {
    fontFamily: fonts.gothic,
    fontSize: 48,
    lineHeight: 56,
  },
  panel: {
    backgroundColor: colors.panelLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  panelActive: {
    backgroundColor: '#9aa3b2',
  },
  panelText: {
    color: '#111',
    fontWeight: '800',
    letterSpacing: 1,
  },
});
