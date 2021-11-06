# React Split Components

一种全新的 React 函数组件写法，再不需要 Hooks

---

## 1. 函数组件与 Hooks 的问题

**1. Why 函数组件？**

为什么 React 官方推崇函数组件？class 组件「又不是不能用」。

因为函数组件更符合 `UI = f(state)` 的哲学理念。

于是 Hooks 来了，给函数组件带来了「内部变量」与「副作用」使其功能完备，同时也是「逻辑共享」的官方方案。

**2. 函数组件的问题**

因为函数每次调用，都会把所有内部变量新建一遍，这在以往开发直觉上，总觉得有些不妥。

`UI = f(state)` 看起来是纯函数，传入 `state`，返回 `UI`。

就像 `饭 = 电路锅(米)`，但如果 `电饭锅` 每次煮饭都把「电路系统」全都新建一遍，这是反直觉的。

我们更希望这个 `f` 就是单纯的煮饭，其它功能是已经「携带」的，而不是每次都「新建」。

**3. Hooks 的问题**

为解决内部变量新建问题，React 提供了 `useState`、`useCallback`、`useMemo`、`useRef` 等。

`state` 必须得用 `useState` 包一下。传给子组件 `props` 的复杂数据类型（函数、数组、对象），得用 `useCallback`、`useMemo` 包一下（大计算量的变量，也得用 `useMemo` 包一下）。若需保留变量，得用 `useRef` 包一下。

而在 `useEffect` 与 `useMemo`、`useCallback` 的实现里，还必须得有 `deps` 这个东西。

以上种种，都让 Hooks 写起来非常反直觉。我不就是用个变量、用个函数，怎么还得包一层？

像 Svelte 那样不好吗？

![](https://s6.jpg.cm/2021/11/06/IjfqGp.jpg)

## 2. 解决问题

**1. 最符合直觉的 `UI = f(state)`：**

```jsx
function Demo(state) {
  return <div>{state.count}</div>;
}
```

**2. 实际中，React 是这样的：**

```jsx
function Demo(props) {
  return <div>{props.count}</div>;
}
```

**3. 若需组件「携带」 state 与功能，而不是每次新建，那就不能写在组件内：**

```jsx
let count = 0;
const onClick = () => {
  count = count + 1;
};

function Demo() {
  return <div onClick={onClick}>{count}</div>;
}
```

分开写破坏了一体性，不太好，还是得写在一起。有没有办法让组件既保有外部变量，又写在一个函数内？

**4. 自然而然的，我们想到了闭包（注意内部返回的才是 React 组件）：**

```jsx
function createDemo() {
  let count = 0;
  const onClick = () => {
    count = count + 1;
  };

  return function Demo() {
    return <div onClick={onClick}>{count}</div>;
  };
}

const Demo = createDemo();
```

此时，`onClick` 函数绝不需要用 `useCallback` 包装，因为它永远不会被新建。使用闭包模式，**我们成功解除了对 `useCallback` 的依赖**。

写到这里，其实已经讲完了 ... 嗯？那这组件怎么用呢？！

## 3. 让功能完备

**1. 实现 `state` 更新：**

```jsx
// 公共辅助函数
const useRender = () => {
  const [, setState] = useState(false);
  return useCallback(() => setState((state) => !state), []);
};

function demo() {
  let render;
  let count = 0;

  const onClick = () => {
    count = count + 1;
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

将组件内才有的 `setState` 函数，以「重新赋值」的方式，传送给外部变量 `render`。若需更新，手动调用 `render()` 即可（当然，函数命名随意，比如 `update`，这里介绍的是设计模式，具体实现没什么约束）。

于是，**我们成功解除了对 `useState` 的依赖**。

上面已经是个可用的组件了，在这里试试：[codesandbox.io/s/react-split-components-1-ycw80](https://codesandbox.io/s/react-split-components-1-ycw80?file=/src/App.js)

**2. 实现 `props` 使用：**

```jsx
function demo() {
  let props;
  let render;

  let count = 0;
  const onClick = () => {
    const { setTheme } = props; // 解构必须写在函数内，因为外部初始 props 值为 undefined
    setTheme();

    count = count + 1;
    render();
  };

  return (newProps) => {
    props = newProps;
    render = useRender();
    const { theme } = newProps;
    return (
      <>
        <h1>{theme}</h1>
        <h1>{count}</h1>
        <button onClick={onClick}>Click me</button>
      </>
    );
  };
}

const Demo = demo();
```

类似 `render`，将 `props` 也以「重新赋值」的方式传给外部变量，供组件外使用。

仔细想一下：通过闭包这种模式，`useMemo` 与 `useRef` 自然就不需要了。

`useMemo` 是因为复杂数据每次新建，得包一下，而使用闭包，就没有这个必要了。而 `useMemo` 类似 `computed` 的机制，可以改成在需重新运算时，手动触发。也就是，`useMemo` 这种声明式写法，被变成了「手动调用」的命令式写法，这更符合直觉（就像 class 组件时代一样）。

`useRef` 是因为变量每次都初始化，得包一下，而使用闭包，是的，变量永远不会被再次新建，而组件天然持有变量更新后的值，这一切都是 JS 的运行机制而已，它就是这么自然而然。

于是，**我们成功解除了对 `useMemo`、`useRef` 的依赖**。

**3. 简化写法：**

```jsx
const useProps = (props) => {
  const [, setState] = useState(false);
  return [props, useCallback(() => setState((state) => !state), [])];
};

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

因为每次新建一个组件，都得定义 `props`、`render` 两个变量，然后组件内再给两者赋值。这里简化一下，把 `props`、`render` 变量初始化放在函数参数（初始均 `undefined`），赋值则在一行内完成。

当然，有 ESLint 规则（`no-param-reassign`）是禁止参数重新赋值的，所以还是：怎么写随意，自己来定。

上文代码，在这里试试：[codesandbox.io/s/react-split-components-2-wl46b](https://codesandbox.io/s/react-split-components-2-wl46b?file=/src/App.js)

**4. 解决 `useEffect` 与 `useLayoutEffect`**

我们已经成功解决了对 `useState`、`useCallback`、`useMemo`、`useRef` 的依赖。Hooks 给函数组件带来了两个功能，「内部变量」与「副作用」，而之前几个 Hooks 都是用来处理「内部变量」，所以利用闭包可以天然的解决。

那么「副作用」呢？我们利用 `render` 函数来实现：

```jsx
const useProps = (props) => {
  // 省略其它代码...
  const [layoutEffect, setLayoutEffect] = useState();
  const [effect, setEffect] = useState();

  useLayoutEffect(() => layoutEffect?.(), [layoutEffect]);
  useEffect(() => effect?.(), [effect]);

  const render = useCallback((callback, isLayoutEffect) => {
    // 省略其它代码...
    if (typeof callback === "function") {
      (isLayoutEffect ? setLayoutEffect : setEffect)(() => callback);
    }
  }, []);

  return [props, render];
};

function demo(props, render) {
  let count = 0;

  const onClick = () => {
    count = count + 1;
    render(() => {
      console.log(count); // callback 将在 useEffect 中调用
    });
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

不用 `render` 也可以另加函数，但利用现成的 `render` 更简洁。

`render()` 可以直接调用，也可以传入参数，`render(callback, isLayoutEffect)`，通过第二个参数判断，callback 将在 `useEffect` 或 `useLayoutEffect` 中调用。注意：理论上 `render` 可以调用多次（虽然这么写不对），而 React 只触发一次更新，所以如果每次都传入 callback 则只有最后一个 callback 生效。

于是，**我们成功解除了对 `useEffect`、`useLayoutEffect` 的依赖**。

在这里试试：[codesandbox.io/s/react-split-components-3-zw6tk](https://codesandbox.io/s/react-split-components-3-zw6tk?file=/src/App.js)

**5. 解决初始接口请求**

React 组件有个非常基础的需求，在 didMount 中发送接口请求，但 Hooks 将 didMount 和 didUpdate 统一为 `useEffect` 后，将这个强需求改为得多个理解步骤才行。

于是，无数人写着 `useEffect(() => {}, [])`，无数项目里实现了 `useMount` Hook，Hooks 本来的意图是复用，但如此简单而基础的需求，用个库似乎也很奇怪，于是人手一个实现，这带来了多少重复工作呢 —— Hooks 的初心是「复用」。

吐槽完了。

上文实现中，外部变量都得在组件第一次渲染后才赋值，这带来了一个问题：`render` 得在第一次 `useEffect` 之后才可用（也就是无法实现 `callback` 在初始 `useEffect` 中调用）。

那请求怎么办呢？我们利用 `useProps` 的参数来实现。

```jsx
const useProps = (props, onMount, isLayoutMount) => {
  // 省略其它代码...
  const onLayoutMountRef = useRef(isLayoutMount && onMount);
  const onMountRef = useRef(!isLayoutMount && onMount);

  useLayoutEffect(() => onLayoutMountRef.current?.(), []);
  useEffect(() => onMountRef.current?.(), []);

  // 省略其它代码...
  return [props, render];
};

function demo(props, render) {
  let data;

  const onMount = () => {
    request().then((res) => {
      data = res.data;
      render();
    });
  };

  return (next) => {
    [props, render] = useProps(next, onMount);
    return (
      <>
        <h1>{JSON.stringify(data)}</h1>
      </>
    );
  };
}

const Demo = demo();
```

这样就行了，在这里试试：[codesandbox.io/s/react-split-components-4-y8hn8](https://codesandbox.io/s/react-split-components-4-y8hn8?file=/src/App.js)

**6. 其它 Hooks：**

目前为止，我们已经解决了 `useState`、`useEffect`、`useCallback`、`useMemo`、`useRef`、`useLayoutEffect`，这些是日常开发中最常用的。官方 Hooks 里还剩下 4 个：`useContext`、`useReducer`、`useImperativeHandle`、`useDebugValue`，就不一一处理了。

简单来说，**如果某个 Hooks 相关变量，要在组件外使用，就以重新赋值的方式传出去**。

在此设计模式下，任何已有需求都是可以被实现的，所谓「功能完备」。

## 4. 隆重介绍 React Split Components (RiC)

我想了下，就像 Higher-Order Components 一样，这种设计模式也得有个命名。

考虑到它是把「变量 + 逻辑」与「组件体」分离开的闭包写法，学习 React Server Components 命名格式，我将其命名为 **React Split Components**，可简称 **RiC**，小 **`i`** 在这里可以很好的表达「分离」的特点（主要是我搜了一下，RSC、RPC、RLC、RTC 全都被占了，天啊，split 一共就 5 个字母）。

React Split Components 的特点：

**1. 解除对 Hooks 的依赖，但不是写回以前的纯函数组件**

通过闭包，天然的就无需 Hooks 包裹了。这能让 React 开发者从「函数组件的反直觉」与「Hooks 的繁琐」中解放出来，写出类似 Svelte 的纯 JS 直觉代码，来构建一个 React 函数组件。

毕竟闭包是 JS 的天然特性。

**2. 仅在写法层面调整，不涉及 ESLint 支持**

其实在设计 `useEffect` 实现的时候，我想到了一种利用现有代码的写法：将 `useEffect(fn, deps)` 变为 `watch(deps, fn)`。但如果这么写，`watch` 的 `deps` 就需要 ESLint 插件支持了（因为 Hooks `deps` 就需要插件支持，否则很容易出错）。

比如组件生成函数的参数顺序与 `useProps` 返回，也可以是 `[render, props]`。但考虑到组件参数为 `props`，`props` 放最前面已经成了开发直觉，所以符合直觉的做法，还是把 `props` 放第一位。

若无必要，勿增实体。我们要将实现尽可能自然、尽可能简化、尽可能符合直觉。`useMemo` 转为命令式编程就比较符合直觉，符合 class 时代习惯，所以现在的实现方式是权衡后的结果。

**3. 类似「高阶组件」，是一种「设计模式」，非 API，无需库支持**

它不是 React 官方 API，无需构建工具支持（比如 React Server Components 就需要）。

它无需第三方库支持（其实 `useProps` 也可以封装成 npm 包，但考虑到每个人习惯不一、需求不一，所以尽可以自己来实现辅助函数，写成一个也好、分开也好、处理更多情况也好、叫别的名字也好，上文代码作为参考即可）。

React Split Components 最终代码示例：[codesandbox.io/s/react-split-components-final-9ftjx](https://codesandbox.io/s/react-split-components-final-9ftjx?file=/src/App.js)

## 5. Hello, RiC

React Split Components (RiC) 示例：

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

多么 Svelte，多么直觉，多么性能自动最优化 bye bye Hooks。
