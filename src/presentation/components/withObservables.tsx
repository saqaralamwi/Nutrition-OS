import React from 'react';
import { Observable } from 'rxjs';
import { useObservable } from '../hooks/useObservable';

/**
 * Higher-Order Component for RxJS Observables.
 * Wraps a component and automatically injects resolved stream data as props.
 *
 * @param observableFactory A function mapping incoming props to an RxJS Observable.
 * @param propName The key name of the injected prop.
 */
export function withObservables<TProps extends object, TData>(
  observableFactory: (props: TProps) => Observable<TData>,
  propName: string
) {
  return function WithObservablesWrapper(
    WrappedComponent: React.ComponentType<TProps & { [key: string]: TData }>
  ) {
    return function ObservablesComponent(props: TProps) {
      const data = useObservable(observableFactory(props));
      const injectedProps = { [propName]: data } as any;

      return <WrappedComponent {...props} {...injectedProps} />;
    };
  };
}
