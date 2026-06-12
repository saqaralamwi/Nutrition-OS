import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface ToastData {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

const TOAST_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const TOAST_BG: Record<string, string> = {
  success: '#D4EDDA',
  error: '#FDE8E8',
  info: '#D1ECF1',
};

const TOAST_TEXT: Record<string, string> = {
  success: '#155724',
  error: colors.danger,
  info: '#0C5460',
};

export default function Toast({ toast, onDismiss }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(-20);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: TOAST_BG[toast.type], opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons
        name={TOAST_ICONS[toast.type]}
        size={20}
        color={TOAST_TEXT[toast.type]}
      />
      <Text style={[styles.text, { color: TOAST_TEXT[toast.type] }]}>
        {toast.text}
      </Text>
      <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
        <Ionicons name="close" size={18} color={TOAST_TEXT[toast.type]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    start: spacing.md,
    end: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 4,
    borderRadius: 10,
    gap: spacing.sm,
    zIndex: 9999,
    elevation: 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  dismiss: {
    padding: spacing.xs,
  },
});
