import {ColorArea as AriaColorArea, type ColorAreaProps} from 'react-aria-components';
import {ColorThumb} from '../ColorThumb';
import './ColorArea.css';

export function ColorArea(props: ColorAreaProps) {
  return (
    <AriaColorArea {...props}>
      <ColorThumb />
    </AriaColorArea>
  );
}
