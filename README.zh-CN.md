# React Split Components (RiC)

[English](./README.md) · 简体中文

---

## 介绍

[React Split Components 介绍 →](./INTRODUCTION.zh-CN.md)

一种全新的 React 函数组件写法，再不需要 Hooks。

像 Svelte 一样写 React，最自然的代码。

## 示例

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
