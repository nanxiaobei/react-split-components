# Introducing React Split Components

A new way of Function Components without Hooks.

English | [简体中文](./INTRODUCTION.zh-CN.md)

---

## 1. The Problem of Function Components and Hooks

**1. Why Function Components?**

Why does React officially promote Functional Components? Class Components isn't "unusable".

Because Functional Components are more in line with React's philosophy `UI = f(state)`.

So Hooks came, bringing "internal variables" and "side effects" to Function Components, making them fully functional. it's also a "logical sharing" solution.

**2. The problem of Function Components**

Because every time the function is called, all the internal variables are created again, which is a bit wrong in the development intuition.

`UI = f(state)` looks like a pure function, pass `state` and return `UI`.

Like `rice = electricCooker(rice)`, but if the `electricCooker` rebuilds its "circuit system" every time it cooks, it's counter-intuitive.

We hope that `f` is simply "cooking", and other functions are already "carried" instead of "create" every time.

**3. The problem of Hooks**

To solve the problem of re-creating variables, React provides `useState`, `useCallback`, `useMemo`, `useRef`.

State needs to be created with `useState`. For complex data types (function, array, object) passed to sub-components, use `useCallback`, `useMemo` to wrap (for large calculations, use `useMemo` too). To keep a variable, wrap it with `useRef`.

In the implementation of `useEffect`, `useCallback` and `useMemo`, there must be a thing called `deps`.

All the above makes Hooks very counter-intuitive to write. Don't I just use a variable or a function, why do I have to wrap it?

Can't write code like Svelte?

<img src="https://s6.jpg.cm/2021/11/06/IjfqGp.jpg" width="440" alt="" />

## 2. Solve the Problem

**1. The most intuitive `UI = f(state)`:**

```jsx
function Demo(state) {
  return <div>{state.count}</div>;
}
```

**2. This is how React works:**

```jsx
function Demo(props) {
  return <div>{props.count}</div>;
}
```

**3. If the component needs to "carry" state and functions, instead of creating new ones each time, it cannot be written in the component:**

```jsx
let count = 0;
const onClick = () => {
  count += 1;
};

function Demo() {
  return <div onClick={onClick}>{count}</div>;
}
```

Writing separately destroys the unity, which is not good. Is there a way to make the component hold external variables, and also write together in one function?

**4. Naturally, we thought of closure (note that the component are returned internally):**

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

Now the `onClick` function doesn't need to be wrapped with `useCallback` because it will never be re-created. With closure, **we successfully lifted the dependency on `useCallback`**.

But closure has a problem: all component instances share one piece closure data. of course this is incorrect.

**5. Solve the data sharing problem of closure, generate each component instance's own closure data dynamically:**

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

So far, I'm actually finished... Huh? How to use this component?!

## 3. Make Abilities Complete

**1. Solve `useState` and component update:**

```jsx
// Public helper function
const useRender = () => {
  const [, setState] = useState(false);
  return useCallback(() => setState((s) => !s), []);
};

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

const Demo = create(demo);
```

The `setState`, which is only in the component, is "re-assigned" to the external variable `render` for use outside the component. If you need to update, manually call `render()` (Of course, the function name is arbitrary, such as `update`, here is the design pattern, there are no constraints on the specific implementation).

As a result, **we successfully lifted the dependency on `useState`**.

Above is already a usable component, try it here: [codesandbox.io/s/react-split-components-1-ycw80](https://codesandbox.io/s/react-split-components-1-ycw80?file=/src/App.js)

**2. Solve `useMemo`, `useRef`, solve props:**

```jsx
function demo() {
  let render;
  let props;

  const getPower = (x) => x * x;

  let count = 0;
  let power = getPower(count); // for useMemo
  const countRef = { current: null }; // for useRef

  const onClick = () => {
    // "props" deconstruction must be written inside function,
    // because external initial value of "props" is undefined
    const { setTheme } = props;
    setTheme();

    count += 1;
    power = getPower(count);
    render();
  };

  return (next) => {
    render = useRender();
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

`props` is passed out as "re-assignment" like `render`. Then we think about it carefully: through closure, `useMemo` and `useRef` are actually no longer needed.

`useMemo` and `useRef` are because variables are created every time and need to be wrapped. With closure, variables won't be re-created, the component will naturally hold updated values of variables. All of these are the operating mechanism of JS, naturally.

The calculation mechanism like computed of `useMemo`, can be changed to manual trigger. Change declarative writing of `useMemo`, to the imperative writing of "manual call", which is more intuitive (just like Class Components).

Therefore, **we successfully lifted the dependence on `useMemo` and `useRef`**.

Try the above code here: [codesandbox.io/s/react-split-components-2-wl46b](https://codesandbox.io/s/react-split-components-2-wl46b?file=/src/App.js)

**3. Solve `useEffect` and `useLayoutEffect`:**

```jsx
const useRender = () => {
  // Omit other code...
  const [layoutUpdated, setLayoutUpdated] = useState();
  const [updated, setUpdated] = useState();

  useLayoutEffect(() => layoutUpdated?.(), [layoutUpdated]);
  useEffect(() => updated?.(), [updated]);

  return useCallback((onUpdated, isLayoutUpdate) => {
    // Omit other code...
    if (typeof onUpdated === 'function') {
      (isLayoutUpdate ? setLayoutUpdated : setUpdated)(() => onUpdated);
    }
  }, []);
};

function demo() {
  let render;
  let count = 0;

  const onClick = () => {
    count += 1;
    render(() => {
      console.log(count); // Will be called in useEffect
    });
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

const Demo = create(demo);
```

Use the existing `render` function to implement `useEffect`, which is more concise (of course you can add another function).

Now `render()` can be called directly, or passed in parameters `render(onUpdated, isLayoutUpdate)`, `isLayoutUpdate` determines `onUpdated` called in `useEffect` or `useLayoutEffect`. Note: In theory `render` can be called multiple times, but React only triggers one update, so if `onUpdated` is passed in each time, only the last one will call.

As a result, **we successfully lifted the dependency on `useEffect` and `useLayoutEffect`**.

Try it here: [codesandbox.io/s/react-split-components-3-zw6tk](https://codesandbox.io/s/react-split-components-3-zw6tk?file=/src/App.js)

**4. Solve "useMount"**

React components have a very basic requirement. Send API requests in didMount. After Hooks unified didMount and didUpdate to `useEffect`, there was an additional step to understand this requirement, so "useMount" was implemented in countless projects.

In the above scheme, external variables will be assigned after the first render of the component. This brings a problem: `render` is only available after the first `useEffect` (so the parameter is named as `onUpdated`), then how to achieve "useMount"? Let's use the parameter of `useRender`.

```jsx
const useRender = (onMounted, isLayoutMount) => {
  // Omit other code...
  const layoutMountedRef = useRef(isLayoutMount && onMounted);
  const mountedRef = useRef(!isLayoutMount && onMounted);

  useLayoutEffect(() => layoutMountedRef.current?.(), []);
  useEffect(() => mountedRef.current?.(), []);

  // Omit other code...
};

function demo() {
  let render;
  let data;

  const onMounted = () => {
    request().then((res) => {
      data = res.data;
      render();
    });
  };

  return () => {
    render = useRender(onMounted);

    return (
      <>
        <h1>{JSON.stringify(data)}</h1>
      </>
    );
  };
}

const Demo = create(demo);
```

That's it, try it here: [codesandbox.io/s/react-split-components-4-y8hn8](https://codesandbox.io/s/react-split-components-4-y8hn8?file=/src/App.js)

**5. Other Hooks**

So far, we have solved `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useLayoutEffect`, these are the most commonly used in development. There are 4 remaining official Hooks: `useContext`, `useReducer`, `useImperativeHandle`, `useDebugValue`, I will not deal with them one by one.

Make it simply: **If a variable can only be obtained in the component, needs to be used outside, pass it out by re-assignment**.

In this design mode, any existing requirement can be realized, so-called "abilities complete".

## 4. Introducing React Split Components (RiC)

Just like Higher-Order Components, this design pattern needs a name.

Considering that closure splits "variables + logics" and "component code", learning the naming style of React Server Components, I named it **React Split Components**, which can be abbreviated as **RiC**, the small **`i`** here is a good expression of the "split" feature (Mainly after searching, I found that RSC, RPC, RLC, RTC are all occupied. Oh, the "split" has only 5 letters.).

Features of React Split Components:

**1. Remove the dependence on Hooks, but not purely Functional Components**

Through closure, no Hooks are required to wrap. This allows React developers to free themselves from the "counter-intuition of Functional Components" and "cumbersomeness of Hooks" and write pure JS intuitive code similar with Svelte.

After all, closure is a natural feature of JS.

**2. Only at the writing level, no need for ESLint support**

In fact, when designing the implementation of `useEffect`, I thought of a way to use existing code: change `useEffect(fn, deps)` to `watch(deps, fn)`. But if like this, the `deps` of `watch` will need an ESLint plugin to support (because Hooks `deps` needs plugin support, otherwise it will easy to make mistake).

If not necessary, do not add entity. We want to achieve as natural as possible, as simple as possible, as intuitive as possible.

**3. Like High-Order Components, it's a "design pattern", not API, no lib needed**

It's not an official React API, doesn't need to be support by building tools (such as React Server Components).

It doesn't need 3rd-party lib support (`useRender` can be encapsulated to a npm package, but considering that everyone has different habits and needs, you can implement the helper function yourself, the above code can be a reference).

React Split Components final code demo: [codesandbox.io/s/react-split-components-final-9ftjx](https://codesandbox.io/s/react-split-components-final-9ftjx?file=/src/App.js)

## 5. Hello, RiC

React Split Components (RiC) example:

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

const Demo = create(demo);
```

How Svelte, how intuitive, How performance is auto optimized and bye bye Hooks.
