import React from 'react';

interface CleanupFn {
  (): void;
}

type AtomReturn<T> = {
  [K in keyof T]: T[K] extends (..._: any[]) => infer R ? R : T[K];
};

interface CreateFnParam<P> {
  props: P;

  atom<T>(state: T): AtomReturn<T>;

  onMount(fn: () => void): void;
  onMount(fn: () => CleanupFn): void;

  onEffect<T>(val: T, fn: (val: T, prevVal: T) => void): void;
  onEffect<T>(val: T, fn: (val: T, prevVal: T) => CleanupFn): void;
}

interface CreateParam<P> {
  (param: CreateFnParam<P>): () => React.ReactElement;
}

interface CreateReturn<P> {
  (props: P): React.ReactElement;
}

declare function create<P>(fn: CreateParam<P>): CreateReturn<P>;

export default create;
