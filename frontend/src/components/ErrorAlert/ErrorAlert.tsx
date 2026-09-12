import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './ErrorAlert.module.css';

export type AlertVariant = 'error' | 'warning' | 'success' | 'info';

export interface ErrorAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

const icons: Record<AlertVariant, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

export const ErrorAlert = React.forwardRef<HTMLDivElement, ErrorAlertProps>(
  (
    {
      variant = 'error',
      title,
      message,
      onDismiss,
      onRetry,
      className,
      ...props
    },
    ref
  ) => {
    const Icon = icons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(styles.alert, styles[`alert--${variant}`], className)}
        {...props}
      >
        <Icon className={styles.icon} aria-hidden="true" />

        <div className={styles.content}>
          {title && <div className={styles.title}>{title}</div>}
          <div className={styles.message}>{message}</div>

          {(onRetry || onDismiss) && (
            <div className={styles.actions}>
              {onRetry && (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={onRetry}
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            className={styles.dismissButton}
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }
);

ErrorAlert.displayName = 'ErrorAlert';
