# React Split Components 介绍

一种全新的 React 函数组件写法，再不需要 Hooks。

[English](./INTRODUCTION.md) | 简体中文

---

## 1. 函数组件与 Hooks 的问题

**1. Why 函数组件？**

为什么 React 官方推崇函数组件？class 组件 "又不是不能用"。

因为函数组件更符合 React `UI = f(state)` 的哲学理念。

于是 Hooks 来了，给函数组件带来了 "内部变量" 与 "副作用"，使其功能完备。同时也是 "逻辑共享" 的解决方案。

**2. 函数组件的问题**

因为函数每次调用，都会把内部变量全都新建一遍，这在开发直觉上，总觉得有些不妥。

`UI = f(state)` 看起来像是纯函数，传入 `state`，返回 `UI`。

就像 `饭 = 电饭锅(米)`，但如果 `电饭锅` 每次煮饭都把 "电路系统" 全都新建一遍，这是反直觉的。

我们更希望 `f` 就是单纯的煮饭，其它功能是已经 "携带" 的，而不是每次都 "新建"。

**3. Hooks 的问题**

为解决变量新建问题，React 提供了 `useState`、`useCallback`、`useMemo`、`useRef` 等。

state 得用 `useState` 包一下。传给子组件的复杂数据类型（函数、数组、对象），得用 `useCallback`、`useMemo` 包一下（大计算量也得用 `useMemo` 包一下）。若需保留变量，得用 `useRef` 包一下。

而在 `useEffect` 与 `useCallback`、`useMemo` 的实现里，必须有 `deps` 这个东西。

以上种种，都让 Hooks 写起来非常反直觉。我不就是用个变量、用个函数，怎么还得包一层？

像 Svelte 那样写不好吗？

<img src="https://s6.jpg.cm/2021/11/06/IjfqGp.jpg" width="440" alt="" />

## 2. 解决问题

**1. 最符合直觉的 `UI = f(state)`：**

```jsx
function Demo(state) {
  return <div>{state.count}</div>;
}
```

**2. React 是这么工作的：**

```jsx
function Demo(props) {
  return <div>{props.count}</div>;
}
```

**3. 若需组件 "携带" state 与函数，而不是每次新建，那就不能写在组件内：**

```jsx
let count = 0;
const onClick = () => {
  count += 1;
};

function Demo() {
  return <div onClick={onClick}>{count}</div>;
}
```

分开写破坏了一体性，不太好。能不能让组件既保有外部变量，又写在一个函数内？

**4. 自然而然的，我们想到了闭包（注意内部返回的才是 React 组件）：**

```jsx
function createDemo() {
  let count = 0;

  const onClick = () => {
    count += 1;
  };

  return function Demo() {
    return <div onClick={onClick}>{count}</div>;
  };
}

const Demo = createDemo();
```

此时，`onClick` 函数永远不会被新建，因此无需用 `useCallback` 包装。使用闭包模式，**我们成功解除了对 `useCallback` 的依赖**。

但闭包有个问题：所有组件实例都共享了一份数据。这当然是不行的。

**5. 解决闭包的数据共享问题，动态生成每个组件实例自己的数据即可：**

```jsx
const create = (fn) => (props) => {
  const [ins] = useState(() => fn());
  return ins(props);
};

function demo() {
  return () => <div />;
}

const Demo = create(demo);
```

写到这里，其实已经讲完了 ... 嗯？那这组件怎么用呢？！

## 3. 让能力完备

**1. 解决 `useState` 与组件更新：**

```jsx
const create = (fn) => (props) => {
  const [, setState] = useState(false);

  const [ins] = useState(() => {
    const render = () => setState((s) => !s);
    return fn({ render });
  });

  return ins(props);
};

function demo({ render }) {
  let count = 0;

  const onClick = () => {
    count += 1;
    render();
  };

  // 省略其它代码...
}

const Demo = create(demo);
```

利用 `create` 函数，将组件更新函数 `render` 从参数传入。若需更新，手动调用 `render` 即可（当然，函数命名随意比如 `update`，这里介绍的是设计模式，具体实现没什么约束）。

于是，**我们成功解除了对 `useState` 的依赖**。

上面已经是个可用的组件了，在这里试试：[codesandbox.io/s/react-split-components-1-ycw80](https://codesandbox.io/s/react-split-components-1-ycw80?file=/src/App.js)

**2. 解决 `useMemo`、`useRef`，解决 props：**

```jsx
function demo({ render }) {
  let props;

  const getPower = (x) => x * x;

  let count = 0;
  let power = getPower(count); // for useMemo
  const countRef = { current: null }; // for useRef

  const onClick = () => {
    // props 使用须写在函数内，因为外部初始 props 值为 undefined
    const { setTheme } = props;
    setTheme();

    count += 1;
    power = getPower(count);
    render();
  };

  return (next) => {
    props = next;
    const { theme } = next;

    return (
      <>
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

以重新赋值的方式将 props 传递出去。然后我们仔细想一下：通过闭包，`useMemo` 与 `useRef` 其实已经不需要了。

`useMemo` 和 `useRef` 是因为变量每次都新建，得包一下。而使用闭包，变量再不会新建，且组件天然保有变量更新后的值，这一切都是 JS 的自然运行机制。

而 `useMemo` 类似 watch 的运算机制，可改为手动触发的「命令式编程」（当然，也可以用 `Proxy` 等自行实现类似 watch 功能，不过这不是重点）。

于是，**我们成功解除了对 `useMemo`、`useRef` 的依赖**。

上文代码，在这里试试：[codesandbox.io/s/react-split-components-2-wl46b](https://codesandbox.io/s/react-split-components-2-wl46b?file=/src/App.js)

**3. 解决 `useEffect` 与 `useLayoutEffect`：**

```jsx
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

function demo({ render, onMounted, onUpdated }) {
  let props;
  let data;
  let count = 0;

  const onClick = () => {
    count += 1;
    render();
  };

  const getData = () => {
    request().then((res) => {
      data = res.data;
      render();
    });
  };

  onMounted(() => {
    getData();
  });

  onUpdated((prevProps) => {
    console.log(prevProps, props);
  });

  return (next) => {
    props = next;

    return (
      <>
        <h1>{loading ? 'loading...' : JSON.stringify(data)}</h1>
        <h1>{count}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
}

const Demo = create(demo);
```

于是，**我们成功解除了对 `useEffect`、`useLayoutEffect` 的依赖**。

在这里试试：[codesandbox.io/s/react-split-components-3-zw6tk](https://codesandbox.io/s/react-split-components-3-zw6tk?file=/src/App.js)

利用 `useMounted` 与 `useUpdated` 实现订阅的例子：[codesandbox.io/s/react-split-components-4-y8hn8](https://codesandbox.io/s/react-split-components-4-y8hn8?file=/src/App.js)

**4. 其它 Hooks**

目前为止，我们已经解决了 `useState`、`useEffect`、`useCallback`、`useMemo`、`useRef`、`useLayoutEffect`，这些是日常开发中最常用的。官方 Hooks 里还剩下 4 个：`useContext`、`useReducer`、`useImperativeHandle`、`useDebugValue`，就不一一处理了。

简单来说：**如果某个组件内才能拿到的变量，需要在组件外使用，就以重新赋值的方式传出去**。

## 4. 隆重介绍 React Split Components (RiC)

就像 Higher-Order Components 一样，这种设计模式得有个命名。

考虑到它是把 "变量 + 逻辑" 与 "组件体" 分离的闭包写法，学习 React Server Components 命名格式，我将其命名为 **React Split Components**，可简称 **RiC**，小 **`i`** 在这里可以很好的表达 "分离" 的特点（主要是搜索后发现，RSC、RPC、RLC、RTC 竟然全被占了，天啊，"split" 一共就 5 个字母）。

React Split Components 的特点：

**1. 解除对 Hooks 的依赖，但不是指纯函数组件**

通过闭包，天然无需 Hooks 包裹。这能让 React 开发者从 "函数组件的反直觉" 与 "Hooks 的繁琐" 中解放出来，写出类似 Svelte 的纯 JS 直觉代码。

毕竟闭包是 JS 的天然特性。

**2. 仅在写法层面，无需 ESLint 支持**

其实在设计 `useEffect` 实现的时候，我想到了一种利用现有代码的写法：将 `useEffect(fn, deps)` 变为 `watch(deps, fn)`。但如果这么写，`watch` 的 `deps` 就需要 ESLint 插件支持了（因为 Hooks `deps` 就需要插件支持，否则很容易出错）。

若无必要，勿增实体。我们要将实现尽可能自然、尽可能简化、尽可能符合直觉。

**3. 类似高阶组件，是一种 "设计模式"，非 API，无需库支持**

它不是 React 官方 API，无需构建工具支持（比如 React Server Components 就需要），无需第三方库支持（其实 `create` 可以封装为 npm 包，但考虑到每个人习惯不一、需求不一，所以尽可以自行实现辅助函数，上文代码可作为参考）。

React Split Components 最终代码示例：[codesandbox.io/s/react-split-components-final-9ftjx](https://codesandbox.io/s/react-split-components-final-9ftjx?file=/src/App.js)

## 5. Hello, RiC

再来看一遍 React Split Components (RiC) 示例：

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

GitHub: [github.com/nanxiaobei/react-split-components](https://github.com/nanxiaobei/react-split-components)
