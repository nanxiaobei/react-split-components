# Introducing React Split Components

A new way of Function Components without Hooks.

English | [简体中文](./INTRODUCTION.zh-CN.md)

---

## 1. The Problem of Function Components and Hooks

**1. Why Function Components?**

Why does React officially promote Functional Components? Class Components isn't "unusable".

Because Functional Components are more in line with React's philosophy `UI = f(state)`.

So Hooks came, bringing "internal variables" and "side effects" to Function Components, making them fully functional. it's also a "logic sharing" solution.

**2. The problem of Function Components**

Because every time the function is called, all the internal variables are created again, which is a bit wrong in the development intuition.

`UI = f(state)` looks like a pure function, pass `state` and return `UI`.

Like `cookedRice = electricCooker(rice)`, but if the `electricCooker` rebuilds its "circuit system" every time it cooks, it's counter-intuitive.

We hope that `f` is simply "cooking", and other functions are already "carried" instead of "create" every time.

**3. The problem of Hooks**

To solve the problem of re-creating variables, React provides `useState`, `useCallback`, `useMemo`, `useRef`.

State needs to be created with `useState`. For complex data types (function, array, object) passed to sub-components, use `useCallback`, `useMemo` to wrap (for large calculations, use `useMemo` too). To keep a variable, wrap it with `useRef`.

In the implementation of `useEffect`, `useCallback` and `useMemo`, there must be a thing called `deps`.

All the above makes Hooks very counter-intuitive to write. Don't I just use a variable or a function, why do I have to wrap it?

Can't be like Svelte?

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

Writing separately destroys the unity, which is not good. Can the component not only hold external variables, but also write them in one function?

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

Now the `onClick` function will never be re-created, so no need to wrap it with `useCallback`. With closure, **we successfully lifted the dependency on `useCallback`**.

But closure has one problem: all component instances share one piece of data. Of course this is incorrect.

**5. Solve the data sharing problem of closure, generate its own data for each component instance dynamically:**

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
const create = (fn) => (props) => {
  const [, setState] = useState(false);

  const [ins] = useState(() => {
    const atom = (initState) => {
      return new Proxy(initState, {
        get: (target, key) => target[key],
        set: (target, key, val) => {
          target[key] = val;
          setState((s) => !s);
          return true;
        },
      });
    };
    return fn({ atom });
  });

  return ins(props);
};

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

Use `create` function to pass in the responsive data generation function `atom` from the parameters, which can be used to generate the responsive state.

As a result, **we successfully lifted the dependency on `useState`**.

Above is already a usable component, try it here: [codesandbox.io/s/react-split-components-1-ycw80](https://codesandbox.io/s/react-split-components-1-ycw80?file=/src/App.js)

**2. Solve `useMemo`, `useRef`, solve props:**

```jsx
function demo({ props, atom }) {
  const state = atom({
    count: 0,
    power: () => state.count * state.count,
  });

  const countRef = { current: null };

  const onClick = () => {
    const { setTheme } = props;
    setTheme();

    state.count += 1;
    console.log('countRef', countRef.current);
  };

  return () => {
    const { theme } = props;
    const { count, power } = state;

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

Pass `props` implemented by Proxy from the function parameters.

Because variables are re-created every time, so wrap them with `useMemo` and `useRef` before, with closure, it is no longer needed, variables will never be re-created, and the component naturally hold the updated values of variables.

And the similar monitoring mechanism of `useMemo`, `Proxy`can be used to support computed data type in`atom`.

Therefore, **we successfully lifted the dependence on `useMemo` and `useRef`**.

Try the above code here: [codesandbox.io/s/react-split-components-2-wl46b](https://codesandbox.io/s/react-split-components-2-wl46b?file=/src/App.js)

**3. Solve `useEffect`:**

```jsx
function demo({ atom, onMount, onEffect }) {
  const state = atom({
    loading: true,
    data: null,
  });

  const getData = () => {
    request().then((res) => {
      state.data = res.data;
      state.loading = false;
    });
  };

  const onReload = () => {
    state.loading = true;
    getData();
  };

  onMount(() => {
    console.log('mounted!');
    getData();
  });

  onEffect(state.data, (val, prevVal) => {
    console.log('state.data', val, prevVal);
  });

  return () => {
    const { loading, data } = state;

    return (
      <>
        <h1>{loading ? 'loading...' : JSON.stringify(data)}</h1>
        <button onClick={onReload}>Reload data</button>
      </>
    );
  };
}

const Demo = create(demo);
```

Pass `onMount` and `onEffect` from the function parameters.

`onMount` is called during mount with only one callback function parameter. `onEffect` has two parameters. The first is the data to be monitored. When the data changes, the callback function of the second parameter will be called.

Both `onMount` and `onEffect` support similar to `useEffect` to clean-up side effects (such as unsubscription) in the returned function.

`onEffect` only supports monitoring one single `props.xxx` or `state.xxx`, because `props` and `state` are responsive data, and the data in all callback functions can always be up-to-date, so there is no need to put in `deps` to receive update. Monitoring one single data change can clearly indicate the source that "logic processing" relies on, thereby making the code clearer.

As a result, **we successfully lifted the dependency on `useEffect`**.

Try it here: [codesandbox.io/s/react-split-components-3-zw6tk](https://codesandbox.io/s/react-split-components-3-zw6tk?file=/src/App.js)

Example of using `onEffect` to implement subscription: [codesandbox.io/s/react-split-components-4-y8hn8](https://codesandbox.io/s/react-split-components-4-y8hn8?file=/src/App.js)

**4. Other Hooks**

So far, we have solved `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, these are the most commonly used in development. There are 5 remaining official Hooks: `useContext`, `useReducer`, `useImperativeHandle`, `useLayoutEffect`, `useDebugValue`, I won't deal with them one by one.

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

It's not an official React API, doesn't need to be support by building tools (such as React Server Components), doesn't need 3rd-party lib support (`create` can be encapsulated to a npm package, but considering that everyone has different habits and needs, you can implement the helper function yourself, the above code can be a reference).

React Split Components final code demo: [codesandbox.io/s/react-split-components-final-9ftjx](https://codesandbox.io/s/react-split-components-final-9ftjx?file=/src/App.js)

## 5. Hello, RiC

Look at React Split Components (RiC) example again:

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

GitHub: [github.com/nanxiaobei/react-split-components](https://github.com/nanxiaobei/react-split-components)
