import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react';

// Demo: https://codesandbox.io/s/react-split-components-final-9ftjx?file=/src/App.js

export const create = (fn) => (props) => {
  const [ins] = useState(() => fn());
  return ins(props);
};

export const useRender = (onMounted, isLayoutMount) => {
  const [, setState] = useState(false);

  const layoutMountedRef = useRef(isLayoutMount && onMounted);
  const mountedRef = useRef(!isLayoutMount && onMounted);
  useLayoutEffect(() => layoutMountedRef.current?.(), []);
  useEffect(() => mountedRef.current?.(), []);

  const [layoutUpdated, setLayoutUpdated] = useState();
  const [updated, setUpdated] = useState();
  useLayoutEffect(() => layoutUpdated?.(), [layoutUpdated]);
  useEffect(() => updated?.(), [updated]);

  return useCallback((onUpdated, isLayoutUpdate) => {
    setState((s) => !s);
    if (typeof onUpdated === 'function') {
      (isLayoutUpdate ? setLayoutUpdated : setUpdated)(() => onUpdated);
    }
  }, []);
};
