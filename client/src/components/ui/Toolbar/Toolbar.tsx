import {Toolbar as RACToolbar, type ToolbarProps} from 'react-aria-components';
import {SeparatorContext} from 'react-aria-components';
import {ToggleButtonGroupContext} from 'react-aria-components';
import './Toolbar.css';

export function Toolbar(props: ToolbarProps) {
  let {orientation = 'horizontal'} = props;
  return (
    <ToggleButtonGroupContext.Provider value={{orientation}}>
      <SeparatorContext.Provider
        value={{orientation: orientation === 'horizontal' ? 'vertical' : 'horizontal'}}>
        <RACToolbar {...props} />
      </SeparatorContext.Provider>
    </ToggleButtonGroupContext.Provider>
  );
}
