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

## 完整示例

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

## 在线演示

[![Edit react-split-components-final](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-split-components-final-9ftjx?fontsize=14&hidenavigation=1&theme=dark)

## 协议

[MIT License](https://github.com/nanxiaobei/react-split-components/blob/main/LICENSE) (c) [nanxiaobei](https://lee.so/)

## FUTAKE

试试 [**FUTAKE**](https://sotake.com/f) 小程序，你的灵感相册。🌈

![](https://s3.bmp.ovh/imgs/2022/07/21/452dd47aeb790abd.png)
