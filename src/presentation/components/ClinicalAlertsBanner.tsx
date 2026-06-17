import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { colors, spacing, fontFamilies } from '../theme';
import { ClinicalAlert } from '../../utils/clinicalAlertsEngine';

interface ClinicalAlertsBannerProps {
  alerts: ClinicalAlert[];
}

export default function ClinicalAlertsBanner({ alerts }: ClinicalAlertsBannerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alerts.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [alerts.length]);

  if (alerts.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {alerts.map((alert) => (
        <View 
          key={alert.id} 
          style={[
            styles.alertCard, 
            alert.type === 'danger' ? styles.dangerCard : styles.warningCard
          ]}
        >
          <View style={styles.header}>
            <Ionicons 
              name={alert.type === 'danger' ? 'alert-circle' : 'warning'} 
              size={20} 
              color={alert.type === 'danger' ? colors.danger : colors.warning} 
            />
            <Text style={[
              styles.title, 
              { color: alert.type === 'danger' ? colors.danger : colors.warning }
            ]}>
              {alert.title}
            </Text>
          </View>
          <Text style={styles.message}>{alert.message}</Text>
          {alert.action && (
            <View style={styles.actionContainer}>
              <Ionicons name="flash" size={14} color={alert.type === 'danger' ? colors.danger : colors.warning} />
              <Text style={[
                styles.actionText,
                { color: alert.type === 'danger' ? colors.danger : colors.warning }
              ]}>
                {alert.action}
              </Text>
            </View>
          )}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  alertCard: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dangerCard: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.danger,
    borderLeftWidth: 4,
  },
  warningCard: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.warning,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
    flex: 1,
  },
  message: {
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },
  actionContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderSubtle,
  },
  actionText: {
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    textAlign: 'right',
  },
});
