# React Split Components (RiC)

English · [简体中文](./README.zh-CN.md)

---

## Introduction

[Introducing React Split Components →](./INTRODUCTION.md)

A new way of Function Components without Hooks.

Write React like Svelte, the most natural code.

## Example

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
