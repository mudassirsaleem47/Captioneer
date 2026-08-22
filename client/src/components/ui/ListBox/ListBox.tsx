import React from 'react';
import {
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  type ListBoxItemProps as RACListBoxItemProps,
  type ListBoxProps as RACListBoxProps,
} from 'react-aria-components';
import './ListBox.css';

export interface ListBoxProps<T> extends RACListBoxProps<T> {}

export function ListBox<T extends object>(props: ListBoxProps<T>) {
  return <RACListBox {...props} className="react-aria-ListBox" />;
}

export function DropdownListBox<T extends object>(props: ListBoxProps<T>) {
  return <RACListBox {...props} className="react-aria-ListBox dropdown-listbox" />;
}

export interface ListBoxItemProps extends RACListBoxItemProps {}

export function ListBoxItem(props: ListBoxItemProps) {
  return <RACListBoxItem {...props} className="react-aria-ListBoxItem" />;
}

export function DropdownItem(props: ListBoxItemProps) {
  return <RACListBoxItem {...props} className="react-aria-ListBoxItem dropdown-item" />;
}
