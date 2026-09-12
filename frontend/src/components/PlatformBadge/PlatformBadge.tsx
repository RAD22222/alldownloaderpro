import React from 'react';
import { Platform } from '@/types';
import { platforms } from '@/utils/platforms';
import { cn } from '@/utils/cn';
import styles from './PlatformBadge.module.css';

export interface PlatformBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showName?: boolean;
}

export const PlatformBadge = React.forwardRef<HTMLSpanElement, PlatformBadgeProps>(
  ({ platform, size = 'md', showIcon = true, showName = true, className, ...props }, ref) => {
    const config = platforms[platform];

    return (
      <span
        ref={ref}
        className={cn(
          styles.badge,
          styles[`badge--${size}`],
          styles[`badge--${platform}`],
          className
        )}
        {...props}
      >
        {showIcon && (
          <span className={styles.icon} aria-hidden="true">
            {config.name.charAt(0)}
          </span>
        )}
        {showName && <span>{config.name}</span>}
      </span>
    );
  }
);

PlatformBadge.displayName = 'PlatformBadge';
