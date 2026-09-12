import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { ProcessingStep } from '@/types';
import { cn } from '@/utils/cn';
import styles from './ProcessingIndicator.module.css';

export interface ProcessingStepConfig {
  id: ProcessingStep;
  label: string;
  description?: string;
}

export interface ProcessingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: ProcessingStepConfig[];
  currentStep: ProcessingStep;
  progress: number;
  onCancel?: () => void;
}

const stepOrder: ProcessingStep[] = [
  'validating',
  'detecting',
  'analyzing',
  'retrieving',
  'preparing',
];

function getStepStatus(
  stepId: ProcessingStep,
  currentStep: ProcessingStep
): 'pending' | 'active' | 'completed' | 'error' {
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(stepId);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

export const ProcessingIndicator = React.forwardRef<HTMLDivElement, ProcessingIndicatorProps>(
  ({ steps, currentStep, progress, onCancel, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(styles.container, className)} {...props}>
        <div className={styles.steps}>
          {steps.map((step) => {
            const status = getStepStatus(step.id, currentStep);

            return (
              <div
                key={step.id}
                className={cn(
                  styles.step,
                  status === 'active' && styles['step--active'],
                  status === 'completed' && styles['step--completed']
                )}
              >
                <div className={styles.stepIcon}>
                  {status === 'completed' && <Check size={16} />}
                  {status === 'active' && <Loader2 size={16} />}
                  {status === 'pending' && (
                    <span>{stepOrder.indexOf(step.id) + 1}</span>
                  )}
                </div>

                <div className={styles.stepContent}>
                  <div className={styles.stepLabel}>{step.label}</div>
                  {step.description && (
                    <div className={styles.stepDescription}>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Progress</span>
            <span className={styles.progressValue}>{Math.round(progress)}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            <X size={16} />
            Cancel
          </button>
        )}
      </div>
    );
  }
);

ProcessingIndicator.displayName = 'ProcessingIndicator';
