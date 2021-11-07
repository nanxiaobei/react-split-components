# React Split Components (RiC)

一种全新的 React 函数组件写法，再不需要 Hooks。

[English](./README.md) | 简体中文

---

## 介绍

[React Split Components 介绍 →](./INTRODUCTION.zh-CN.md)

像 Svelte 一样写 React，最自然的代码。

## 简单示例

```jsx
function demo(props, render) {
  let count = 0;

  const onClick = () => {
    count = count + 1;
    render();
  };

  return (next) => {
    [props, render] = useProps(next);

    return (
      <>
        <h1>{count}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
}

const Demo = demo();
```

## 完整示例

```jsx
const demo = (props, render) => {
  // for useState
  let loading = true;
  let data;
  let count = 0;

  // for useMemo
  const getPower = () => count * count;
  let power = getPower();

  // for useRef
  const themeRef = { current: null };

  // for useCallback
  const onClick = () => {
    const { setTheme } = props; // for props
    setTheme();

    count = count + 1;
    power = getPower();

    render(() => {
      console.log('themeRef', themeRef.current); //  for useEffect or useLayoutEffect
    });
  };

  // for "useMount"
  const onMount = () => {
    request().then((res) => {
      data = res.data;
      loading = false;
      render();
    });
  };

  return (next) => {
    [props, render] = useProps(next, onMount);
    const { theme } = next;

    return (
      <>
        <h1>{loading ? 'loading...' : JSON.stringify(data)}</h1>
        <h1 ref={themeRef}>{theme}</h1>
        <h1>{count}</h1>
        <h1>{power}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
};
```

## 在线演示

[![Edit react-split-components-4](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-split-components-4-y8hn8?fontsize=14&hidenavigation=1&theme=dark)

## 辅助函数

`useProps` 实现示例：

```jsx
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
```

## 协议

[MIT License](https://github.com/nanxiaobei/react-split-components/blob/main/LICENSE) (c) [nanxiaobei](https://lee.so/)

## FUTAKE

试试 [**FUTAKE**](https://sotake.com/f) 小程序，你的灵感相册。🌈

![FUTAKE](https://s3.jpg.cm/2021/09/21/IFG3wi.png)
