import { useState, useEffect, useMemo, useRef } from 'react';

const defaultGetter = (target, key) => target[key];
const noop = () => {};
const defaultCallbacks = {
  onPropsUpdate: noop,
  onDeriveUpdate: noop,
  onEffectUpdate: noop,
  onEffectMount: noop,
};

const create = (fn) => (props) => {
  const [, setState] = useState(false);
  const callbacks = useRef(defaultCallbacks);

  useMemo(() => callbacks.current.onPropsUpdate(props), [props]);
  callbacks.current.onDeriveUpdate();
  useEffect(() => callbacks.current.onEffectUpdate());
  useEffect(() => callbacks.current.onEffectMount(), []);

  const [ins] = useState(() => {
    const stateTarget = {};
    const deriveState = {};
    const deriveMap = {};

    let propsProxy = { ...props };
    let deriveUpdates = {};
    let effectMap = {};
    let effectUpdates = [];

    let curUniqueId = null;
    let curDerive = null;

    const createHandler = (type) => ({
      get(target, key) {
        curUniqueId = `${type}.${key}`;
        if (curDerive) {
          if (!deriveMap[curUniqueId]) deriveMap[curUniqueId] = {};
          deriveMap[curUniqueId][curDerive.key] = curDerive.getter;
        }
        return target[key];
      },
      set(target, key, val) {
        if (val !== target[key]) {
          const uniqueId = `${type}.${key}`;
          const deriveData = deriveMap[uniqueId];
          const effectData = effectMap[uniqueId];

          if (deriveData) Object.assign(deriveUpdates, deriveData);
          if (effectData) {
            effectData.params = [val, target[key]];
            effectUpdates.push(uniqueId);
          }
        }
        target[key] = val;
        if (type === 'state') setState((s) => !s);
        return true;
      },
    });

    const propsHandler = createHandler('props');
    const stateHandler = createHandler('state');

    propsProxy = new Proxy(propsProxy, propsHandler);

    const atom = (initState) => {
      Object.entries(initState).forEach(([key, val]) => {
        if (typeof val === 'function') deriveState[key] = val;
        stateTarget[key] = val;
      });
      return new Proxy(stateTarget, stateHandler);
    };

    let onMountCb;
    const onMount = (fn) => {
      if (typeof fn === 'function') onMountCb = fn;
    };

    const onEffect = (val, fn) => {
      if (typeof fn !== 'function') return;
      if (effectMap[curUniqueId]) return;
      effectMap[curUniqueId] = { params: [val], fn };
      effectUpdates.push(curUniqueId);
      curUniqueId = null;
    };

    callbacks.current = {
      onPropsUpdate: (nextProps) => {
        Object.assign(propsProxy, nextProps);
      },
      onDeriveUpdate: () => {
        const keys = Object.keys(deriveUpdates);
        if (keys.length === 0) return;
        keys.forEach((key) => {
          const val = deriveState[key]();
          stateTarget[key] = val;

          const uniqueId = `state.${key}`;
          const effectData = effectMap[uniqueId];
          if (effectData) {
            effectData.params = [val, effectData.params[0]];
            effectUpdates.push(uniqueId);
          }
        });
        deriveUpdates = {};
      },
      onEffectUpdate: () => {
        effectUpdates.forEach((uniqueId) => {
          const { clear, fn, params } = effectMap[uniqueId];
          if (typeof clear === 'function') clear();
          effectMap[uniqueId].clear = fn(...params);
        });
        effectUpdates = [];
      },
      onEffectMount: () => {
        const unmount = typeof onMountCb === 'function' && onMountCb();
        return () => {
          Object.values(effectMap).forEach(({ clear }) => {
            if (typeof clear === 'function') clear();
          });
          effectMap = {};
          if (typeof unmount === 'function') unmount();
        };
      },
    };

    const res = fn({ props: propsProxy, atom, onMount, onEffect });

    Object.entries(deriveState).forEach(([key, getter]) => {
      curDerive = { key, getter };
      const val = getter();
      curDerive = null;

      stateTarget[key] = val;
      const effectData = effectMap[`state.${key}`];
      if (effectData) effectData.params = [val];
    });

    propsHandler.get = defaultGetter;
    stateHandler.get = defaultGetter;
    return res;
  });

  return ins(props);
};

export default create;
