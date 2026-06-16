export interface ClinicalAlertEntity {
  id: string;
  patientId?: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  condition?: string;
  recommendation?: string;
  isRead: boolean;
  isDismissed: boolean;
  triggeredBy?: string;
  triggerValue?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: AlertSeverity;
  messageTemplate: string;
  messageTemplateAr?: string;
  recommendation?: string;
  enabled: boolean;
}

export const ALERT_SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export function sortAlertsBySeverity(alerts: ClinicalAlertEntity[]): ClinicalAlertEntity[] {
  return [...alerts].sort(
    (a, b) => ALERT_SEVERITY_ORDER[b.severity] - ALERT_SEVERITY_ORDER[a.severity],
  );
}

export function getUnreadAlerts(alerts: ClinicalAlertEntity[]): ClinicalAlertEntity[] {
  return alerts.filter((a) => !a.isRead && !a.isDismissed);
}

export function getCriticalAlerts(alerts: ClinicalAlertEntity[]): ClinicalAlertEntity[] {
  return alerts.filter((a) => a.severity === 'critical' && !a.isDismissed);
}

export function createAlert(
  alertType: string,
  severity: AlertSeverity,
  title: string,
  message: string,
  options?: {
    patientId?: string;
    titleAr?: string;
    messageAr?: string;
    condition?: string;
    recommendation?: string;
    triggeredBy?: string;
    triggerValue?: string;
  },
): Omit<ClinicalAlertEntity, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    patientId: options?.patientId,
    alertType,
    severity,
    title,
    titleAr: options?.titleAr,
    message,
    messageAr: options?.messageAr,
    condition: options?.condition,
    recommendation: options?.recommendation,
    isRead: false,
    isDismissed: false,
    triggeredBy: options?.triggeredBy,
    triggerValue: options?.triggerValue,
  };
}
