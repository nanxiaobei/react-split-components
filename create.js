import { useState, useEffect, useMemo, useRef } from 'react';

const create = (fn) => (props) => {
  const [, setState] = useState(false);
  const mountCallback = useRef();

  const propsProxy = useRef({});
  const stateTarget = useRef({});
  const deriveState = useRef({});

  const deriveMap = useRef({});
  const deriveRefresh = useRef({});

  const effectSource = useRef({});
  const effectRunning = useRef([]);

  useMemo(() => {
    Object.assign(propsProxy.current, props);
  }, [props]);

  Object.keys(deriveRefresh.current).forEach((key) => {
    const val = deriveState.current[key]();
    stateTarget.current[key] = val;

    const uniqueId = `state.${key}`;
    const effectData = effectSource.current[uniqueId];
    if (effectData) {
      effectData.params = [val, effectData.params[0]];
      effectRunning.current.push(uniqueId);
    }
  });

  deriveRefresh.current = {};

  useEffect(() => {
    effectRunning.current.forEach((uniqueId) => {
      const { clear } = effectSource.current[uniqueId];
      if (typeof clear === 'function') clear();
    });
  });

  useEffect(() => {
    effectRunning.current.forEach((uniqueId) => {
      const { fn, params } = effectSource.current[uniqueId];
      effectSource.current[uniqueId].clear = fn(...params);
    });
    effectRunning.current = [];
  });

  useEffect(() => {
    return () => {
      Object.values(effectSource.current).forEach(({ clear }) => {
        if (typeof clear === 'function') clear();
      });
      effectSource.current = {};
    };
  }, []);

  useEffect(() => mountCallback.current?.(), []);

  const [ins] = useState(() => {
    let curUniqueId = null;
    let curDerivePair = null;

    const createHandler = (type) => ({
      get(target, key) {
        curUniqueId = `${type}.${key}`;
        if (curDerivePair) {
          if (!deriveMap.current[curUniqueId]) {
            deriveMap.current[curUniqueId] = {};
          }
          const [deriveKey, deriveGetter] = curDerivePair;
          deriveMap.current[curUniqueId][deriveKey] = deriveGetter;
        }
        return target[key];
      },
      set(target, key, val) {
        if (val !== target[key]) {
          const uniqueId = `${type}.${key}`;
          const deriveData = deriveMap.current[uniqueId];
          if (deriveData) {
            Object.assign(deriveRefresh.current, deriveData);
          }
          const effectData = effectSource.current[uniqueId];
          if (effectData) {
            effectData.params = [val, target[key]];
            effectRunning.current.push(uniqueId);
          }
        }
        target[key] = val;
        if (type === 'state') setState((s) => !s);
        return true;
      },
    });

    const propsHandler = createHandler('props');
    const stateHandler = createHandler('state');

    propsProxy.current = new Proxy(propsProxy.current, propsHandler);

    const atom = (initState) => {
      Object.entries(initState).forEach(([key, val]) => {
        if (typeof val === 'function') deriveState.current[key] = val;
        stateTarget.current[key] = val;
      });
      return new Proxy(stateTarget.current, stateHandler);
    };

    const onEffect = (val, fn) => {
      if (effectSource.current[curUniqueId]) {
        throw new Error(`${curUniqueId} effect is already exist`);
      }
      effectSource.current[curUniqueId] = { params: [val], fn };
      effectRunning.current.push(curUniqueId);
      curUniqueId = null;
    };

    const onMount = (fn) => {
      mountCallback.current = fn;
    };

    const res = fn({ props: propsProxy.current, atom, onMount, onEffect });

    Object.entries(deriveState.current).forEach(([key, getter]) => {
      curDerivePair = [key, getter];
      const val = getter();
      curDerivePair = null;

      stateTarget.current[key] = val;
      const effectData = effectSource.current[`state.${key}`];
      if (effectData) effectData.params = [val];
    });

    const get = (target, key) => target[key];
    propsHandler.get = get;
    stateHandler.get = get;
    return res;
  });

  return ins(props);
};

export default create;
