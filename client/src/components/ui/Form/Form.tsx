import {Form as RACForm, type FormProps} from 'react-aria-components';
import {type LabelProps, Label as RACLabel} from 'react-aria-components';
import {type FieldErrorProps, FieldError as RACFieldError} from 'react-aria-components';
import {type ButtonProps, Button} from 'react-aria-components';
import {type TextProps} from 'react-aria-components';
import './Form.css';
import {Text} from '../Content';

export function Form(props: FormProps) {
  return <RACForm {...props} />;
}

export function Label(props: LabelProps) {
  return <RACLabel {...props} />;
}

export function FieldError(props: FieldErrorProps) {
  return <RACFieldError {...props} />;
}

export function Description(props: TextProps) {
  return <Text slot="description" className="field-description" {...props} />;
}

export function FieldButton(props: ButtonProps) {
  return <Button {...props} className="field-Button" />;
}
