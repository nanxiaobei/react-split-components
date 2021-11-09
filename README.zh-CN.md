# React Split Components (RiC)

一种全新的 React 函数组件写法，再不需要 Hooks。

[English](./README.md) | 简体中文

---

## 介绍

[React Split Components 介绍 →](./INTRODUCTION.zh-CN.md)

闭包模式的 React 函数组件。

像写 Svelte 一样写 React，最自然流畅的代码。

## 特点

- 解除对 Hooks 的依赖，但不是指纯函数组件
- 仅在写法层面，无需 ESLint 支持
- 类似高阶组件，是一种 "设计模式"，非 API，无需库支持

## 简单示例

```jsx
function demo({ render }) {
  let count = 0;

  const onClick = () => {
    count += 1;
    render();
  };

  return () => (
    <>
      <h1>{count}</h1>
      <button onClick={onClick}>Click me</button>
    </>
  );
}

const Demo = create(demo);
```

## 完整示例

```jsx
function demo({ render, onMounted, onUpdated }) {
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

    render();
  };

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

  // 解决 useEffect | useLayoutEffect
  onMounted(() => {
    getData();
  });

  onUpdated((prevProps) => {
    console.log(prevProps, props);
  });

  return (next) => {
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

const Demo = create(demo);
```

## 在线演示

[![Edit react-split-components-final](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-split-components-final-9ftjx?fontsize=14&hidenavigation=1&theme=dark)

## 辅助函数

`create` 实现示例：

```js
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

// const Demo = create(demo);
// const Demo = memo(create(demo)); // if memo
// const Demo = forwardRef(create(demo)); // if forwardRef
```

## 协议

[MIT License](https://github.com/nanxiaobei/react-split-components/blob/main/LICENSE) (c) [nanxiaobei](https://lee.so/)

## FUTAKE

试试 [**FUTAKE**](https://sotake.com/f) 小程序，你的灵感相册。🌈

![FUTAKE](https://s3.jpg.cm/2021/09/21/IFG3wi.png)
