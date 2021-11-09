# React Split Components (RiC)

A new way of Function Components without Hooks.

English | [简体中文](./README.zh-CN.md)

---

## Introduction

[Introducing React Split Components →](./INTRODUCTION.md)

React Function Components in closure style.

Write React like Svelte, just natural and fluent code.

## Features

- Remove the dependence on Hooks, but not purely Functional Components
- Only at the writing level, no need for ESLint support
- Like High-Order Components, it's a "design pattern", not API, no lib needed

## Simple Example

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

## Full Example

```jsx
function demo({ render, onMounted, onUpdated }) {
  let props;

  // solve useState
  let loading = true;
  let data;
  let count = 0;

  // solve useMemo
  const getPower = (x) => x * x;
  let power = getPower(count);

  // solve useRef
  const countRef = { current: null };

  // solve useCallback
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

  // solve useEffect | useLayoutEffect
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

## Online Demo

[![Edit react-split-components-final](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-split-components-final-9ftjx?fontsize=14&hidenavigation=1&theme=dark)

## Helper Function

`create` implementation example:

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

## License

[MIT License](https://github.com/nanxiaobei/react-split-components/blob/main/LICENSE) (c) [nanxiaobei](https://lee.so/)

## FUTAKE

Try [**FUTAKE**](https://sotake.com/f) in WeChat. A mini app for your inspiration moments. 🌈

![FUTAKE](https://s3.jpg.cm/2021/09/21/IFG3wi.png)
