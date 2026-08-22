import React from 'react';
import {
  ProgressBar as RACProgressBar,
  type ProgressBarProps as RACProgressBarProps,
} from 'react-aria-components';
import './ProgressCircle.css';

export interface ProgressCircleProps extends Omit<RACProgressBarProps, 'children'> {
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressCircle({ size = 'sm', ...props }: ProgressCircleProps) {
  return (
    <RACProgressBar
      {...props}
      className={`react-aria-ProgressBar progress-circle progress-circle--${size}`}
    >
      <svg viewBox="0 0 32 32" fill="none" strokeWidth="3">
        <circle cx="16" cy="16" r="14" className="track" />
        <circle cx="16" cy="16" r="14" className="fill" pathLength="100" />
      </svg>
    </RACProgressBar>
  );
}

export default ProgressCircle;
