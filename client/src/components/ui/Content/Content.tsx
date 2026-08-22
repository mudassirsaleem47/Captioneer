import {Heading as AriaHeading, type HeadingProps} from 'react-aria-components';
import {Text as AriaText, type TextProps} from 'react-aria-components';
import './Content.css';

export function Heading(props: HeadingProps) {
  return <AriaHeading {...props} />;
}

export function Text(props: TextProps) {
  return <AriaText {...props} />;
}
