import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies, fontSizes, lineHeights } from '../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'حدث خطأ غير متوقع' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Unhandled rendering error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: null });
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    } else {
      this.handleRetry();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
            </View>
            <Text style={styles.title}>عذراً، حدث خطأ غير متوقع</Text>
            <Text style={styles.subtitle}>
              {this.state.errorMessage || 'تعذرت معالجة هذه الشاشة. يرجى إعادة المحاولة.'}
            </Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.primaryContrast} />
                <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reloadButton}
                onPress={this.handleReload}
                activeOpacity={0.8}
              >
                <Ionicons name="home-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.reloadButtonText}>العودة إلى الرئيسية</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.sm * lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  actionsContainer: {
    gap: spacing.sm,
    width: '100%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm + 4,
  },
  retryButtonText: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.bold,
    color: colors.primaryContrast,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 4,
  },
  reloadButtonText: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.medium,
    color: colors.textSecondary,
  },
});
