import type * as React from 'react';

declare global {
  namespace JSX {
    interface Element
      extends React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>> {}
    interface ElementClass extends React.Component<object> {
      render(): React.ReactNode;
    }
    interface IntrinsicElements {
      [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
