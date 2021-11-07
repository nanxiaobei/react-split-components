# React Split Components (RiC)

一种全新的 React 函数组件写法，再不需要 Hooks。

[English](./README.md) | 简体中文

---

## 介绍

[React Split Components 介绍 →](./INTRODUCTION.zh-CN.md)

闭包模式的 React 函数组件。

像写 Svelte 一样写 React，最自然流畅的代码。

## 简单示例

```jsx
function demo() {
  let render;
  let count = 0;

  const onClick = () => {
    count += 1;
    render();
  };

  return () => {
    render = useRender();

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
function demo() {
  let render;
  let props;

  // 解决 useState
  let loading = true;
  let data;
  let count = 0;

  // 解决 useMemo
  const getPower = (x) => x * x;
  let power = getPower(count);

  // 解决 useRef
  const countRef = { current: null };

  // 解决 useCallback
  const onClick = () => {
    const { setTheme } = props;
    setTheme();

    count = count + 1;
    power = getPower(count);

    render(() => {
      // 解决 useEffect | useLayoutEffect
      console.log('countRef', countRef.current);
    });
  };

  // 解决 "useMount"
  const getData = () => {
    request().then((res) => {
      data = res.data;
      loading = false;
      render();
    });
  };

  const onReload = () => {
    loading = true;
    render();
    getData();
  };

  return (next) => {
    render = useRender(getData);
    props = next;
    const { theme } = next;

    return (
      <>
        <h1>{loading ? 'loading...' : JSON.stringify(data)}</h1>
        <button onClick={onReload}>Reload data</button>
        <h1>{theme}</h1>
        <h1 ref={countRef}>{count}</h1>
        <h1>{power}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
}
```

## 在线演示

[![Edit react-split-components-final](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-split-components-final-9ftjx?fontsize=14&hidenavigation=1&theme=dark)

## 辅助函数

`useRender` 实现示例：

```jsx
const useRender = (onMounted, isLayoutMount) => {
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

export default useRender;
```

## 协议

[MIT License](https://github.com/nanxiaobei/react-split-components/blob/main/LICENSE) (c) [nanxiaobei](https://lee.so/)

## FUTAKE

试试 [**FUTAKE**](https://sotake.com/f) 小程序，你的灵感相册。🌈

![FUTAKE](https://s3.jpg.cm/2021/09/21/IFG3wi.png)
