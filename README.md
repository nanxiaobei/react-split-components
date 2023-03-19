# React Split Components (RiC)

A new way of React Components without Hooks.

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
function demo({ atom }) {
  const state = atom({
    count: 0,
  });

  const onClick = () => {
    state.count += 1;
  };

  return () => {
    const { count } = state;
    return (
      <>
        <h1>{count}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
}

const Demo = create(demo);
```

## Full Example

```jsx
function demo({ props, atom, onMount, onEffect }) {
  const state = atom({
    // for useState
    loading: true,
    data: null,
    count: 0,

    // for useMemo
    power: () => state.count * state.count,
    text: () => `${props.theme} ~ ${state.count}`,
  });

  // for useRef
  const countRef = { current: null };

  // for useCallback
  const onClick = () => {
    const { setTheme } = props;
    setTheme();
    state.count += 1;
  };

  const getData = () => {
    request().then((res) => {
      state.data = res.data;
      state.loading = false;
    });
  };

  // for useEffect
  onMount(() => {
    getData();
    console.log('mount!');

    return () => {
      console.log('unmount!');
    };
  });

  onEffect(state.power, (val, prevVal) => {
    console.log('enter state.power', val, prevVal);

    return () => {
      console.log('clear state.power', val, prevVal);
    };
  });

  const onReload = () => {
    state.loading = true;
    getData();
  };

  return () => {
    const { theme } = props;
    const { loading, data, count, power, text } = state;

    return (
      <>
        <h1>{loading ? 'loading...' : JSON.stringify(data)}</h1>
        <button onClick={onReload}>Reload data</button>
        <h1>{theme}</h1>
        <h1 ref={countRef}>{count}</h1>
        <h1>{power}</h1>
        <h1>{text}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
}

const Demo = create(demo);
```

## Online Demo

[![Edit react-split-components-final](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-split-components-final-9ftjx?fontsize=14&hidenavigation=1&theme=dark)

## License

[MIT License](https://github.com/nanxiaobei/react-split-components/blob/main/LICENSE) (c) [nanxiaobei](https://lee.so/)

## FUTAKE

Try [**FUTAKE**](https://sotake.com/futake) in WeChat. A mini app for your inspiration moments. 🌈

![](https://s3.bmp.ovh/imgs/2022/07/21/452dd47aeb790abd.png)
