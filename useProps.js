import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react';

// https://codesandbox.io/s/react-split-components-final-9ftjx?file=/src/App.js

const useProps = (props, onMount, isLayoutMount) => {
  const [, setState] = useState(false);
  const [layoutEffect, setLayoutEffect] = useState();
  const [effect, setEffect] = useState();

  const onLayoutMountRef = useRef(isLayoutMount && onMount);
  const onMountRef = useRef(!isLayoutMount && onMount);

  useLayoutEffect(() => onLayoutMountRef.current?.(), []);
  useEffect(() => onMountRef.current?.(), []);
  useLayoutEffect(() => layoutEffect?.(), [layoutEffect]);
  useEffect(() => effect?.(), [effect]);

  const render = useCallback((callback, isLayoutEffect) => {
    setState((state) => !state);
    if (typeof callback === 'function') {
      (isLayoutEffect ? setLayoutEffect : setEffect)(() => callback);
    }
  }, []);

  return [props, render];
};

export default useProps;
