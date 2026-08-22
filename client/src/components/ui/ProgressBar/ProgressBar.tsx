import {
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps
} from 'react-aria-components';
import {Label} from '../Form';
import './ProgressBar.css';

export interface ProgressBarProps extends AriaProgressBarProps {
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({label, showValue = true, ...props}: ProgressBarProps) {
  return (
    <AriaProgressBar {...props}>
      {({percentage, valueText, isIndeterminate}) => (
        <>
          {label && <Label>{label}</Label>}
          {label && showValue && <span className="value">{valueText}</span>}
          <div className="track inset">
            <div
              className="fill"
              style={{'--percent': (isIndeterminate ? 100 : percentage) + '%'} as any}
            />
          </div>
        </>
      )}
    </AriaProgressBar>
  );
}
