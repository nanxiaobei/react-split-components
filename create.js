import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react';

// Demo: https://codesandbox.io/s/react-split-components-final-9ftjx?file=/src/App.js

const create = (fn) => (props, ref) => {
  const [, setState] = useState(false);

  const hasMount = useRef(false);
  const prevProps = useRef(props);
  const layoutUpdated = useRef();
  const updated = useRef();
  const layoutMounted = useRef();
  const mounted = useRef();

  useLayoutEffect(() => {
    if (!hasMount.current || !layoutUpdated.current) return;
    layoutUpdated.current(prevProps.current);
  });

  useEffect(() => {
    if (!hasMount.current || !updated.current) return;
    updated.current(prevProps.current);
    prevProps.current = props;
  });

  useLayoutEffect(() => {
    if (layoutMounted.current) return layoutMounted.current();
  }, []);

  useEffect(() => {
    hasMount.current = true;
    if (mounted.current) return mounted.current();
  }, []);

  const [ins] = useState(() => {
    const render = () => setState((s) => !s);
    const onMounted = (callback, isLayout) => {
      if (typeof callback !== 'function') return;
      (isLayout ? layoutMounted : mounted).current = callback;
    };
    const onUpdated = (callback, isLayout) => {
      if (typeof callback !== 'function') return;
      (isLayout ? layoutUpdated : updated).current = callback;
    };
    return fn({ render, onMounted, onUpdated });
  });

  return ins(props, ref);
};

export default create;
