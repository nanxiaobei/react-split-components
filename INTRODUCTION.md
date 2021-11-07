# Introducing React Split Components

A new way of Function Components without Hooks.

English · [简体中文](./INTRODUCTION.zh-CN.md)

---

## 1. The Problem of Function Components and Hooks

**1. Why Function Components?**

Why does React officially promote Functional Components? Class Components is "not unusable".

Because Functional Components are more in line with the philosophy of `UI = f(state)`.

So Hooks came, bringing "internal variables" and "side effects" to Function Components to make them fully functional, and it is also the official solution for "logic sharing".

**2. The Problem of Function Components**

Because every time the function is called, all internal variables are re-created, which is a bit wrong in the past development intuition.

`UI = f(state)` looks like a pure function. Pass `state` and return `UI`.

It's like `rice = electricCooker(rice)`, but if the `electricCooker` rebuilds its "circuit system" every time it cooks, it is counter-intuitive.

We hope that `f` is simply "cooking", and other functions are already "carried" instead of "create" every time.

**3. The Problem of Hooks**

To solve the problem of creating internal variables, React provides `useState`, `useCallback`, `useMemo`, `useRef`.

`state` must be created with `useState`. The complex data types (function, array, object) passed to the sub-component `props` must be wrap with `useCallback`, `useMemo` (variables with a large amount of calculation must also be wrapped with `useMemo`). If you need to keep the variables, you have to wrap it with `useRef`.

In the implementation of `useEffect` and `useCallback`, `useMemo`, there must be `deps`.

All the above makes Hooks very counter-intuitive to write. Don't I just use a variable or a function, why do I have to wrap it up?

Can't be just like Svelte?

![](https:////s6.jpg.cm/2021/11/06/IjfqGp.jpg)

## 2. Solve the Problem

**1. The most intuitive `UI = f(state)`:**

```jsx
function Demo(state) {
  return <div>{state.count}</div>;
}
```

**2. In practice, React is like this:**

```jsx
function Demo(props) {
  return <div>{props.count}</div>;
}
```

**3. If component needs to "carry" values and functions, instead of re-creating each time, they cannot be written inside component:**

```jsx
let count = 0;
const onClick = () => {
  count = count + 1;
};

function Demo() {
  return <div onClick={onClick}>{count}</div>;
}
```

Writing separately destroys the unity, which is not good. Is there a way to make component hold external variables, but also write in one function?

**4. Naturally, we thought of closure (note that component are returned internally):**

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

At this time, the `onClick` function never needs to be wrapped with `useCallback`, because it will never be re-created. Using the closure pattern, **we successfully lifted the dependency on `useCallback`**.

So far, I'm actually finished... Huh? How to use this component?!

## 3. Make Abilities Complete

**1. Implement `state` update:**

```jsx
// A public auxiliary function
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

Transfer `setState` function inside component to the external variable `render` by "re-assignment". When need update, manually call `render()` (Of course, the function name is arbitrary, such as `update`, here is a design pattern, there are no constraints on the specific implementation).

As a result, **we successfully lifted the dependency on `useState`**.

Above is already a usable component, try it here: [codesandbox.io/s/react-split-components-1-ycw80](https://codesandbox.io/s/react-split-components-1-ycw80?file=/src/App.js)

**2. Implement `props` usage:**

```jsx
function demo() {
  let props;
  let render;

  let count = 0;
  const onClick = () => {
    // Deconstruction must be written inside the function,
    // because the external initial value of `props` is `undefined`
    const { setTheme } = props;
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

Similar to `render`, `props` is also passed to an external variable in "re-assignment" manner to use outside of component.

Think about it carefully: through the closure model, `useMemo` and `useRef` are naturally unnecessary.

`useMemo` is because a complex data needs to be wrapped every time, and using closure, this is not necessary. The mechanism of `useMemo` (similar to `computed`) can be changed to trigger manually when recalculation is required. That is, the declarative coding of `useMemo` has been turned into an imperative coding of "manual call", which is more intuitive (just like Class Components).

`useRef` is because a variable is initialized every time, it has to be wrapped, and using closure, yes, the variable will never be re-created, and component naturally holds the updated value of the variable, Just operating mechanism of JS. That's it, it is so natural.

Therefore, **we successfully lifted the dependence on `useMemo` and `useRef`**.

**3. Simplified writing:**

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

Because every time creating a new component, we have to define the two variables `props` and `render`, and then assign values to both inside component. So we simplify it, put `props` and `render` variable initialization to the function parameters (initials are all `undefined`), and make the assignment done in one line.

Of course, there is an ESLint rule (`no-param-reassign`) that prohibits parameter re-assignment, so it is still: how to write is up to you.

Try the above code here: [codesandbox.io/s/react-split-components-2-wl46b](https://codesandbox.io/s/react-split-components-2-wl46b?file=/src/App.js)

**4. Get rid of `useEffect` and `useLayoutEffect`**

We have successfully resolved the dependency on `useState`, `useCallback`, `useMemo`, and `useRef`. Hooks bring two abilities to Function Components, "internal variables" and "side effects". The previous Hooks are used to deal with "internal variables", using closure can solve it naturally.

So what about "side effects"? We use the `render` function:

```jsx
const useProps = (props) => {
  // Omit other code...
  const [layoutEffect, setLayoutEffect] = useState();
  const [effect, setEffect] = useState();

  useLayoutEffect(() => layoutEffect?.(), [layoutEffect]);
  useEffect(() => effect?.(), [effect]);

  const render = useCallback((callback, isLayoutEffect) => {
    // Omit other code...
    if (typeof callback === 'function') {
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
      console.log(count); // callback will be called in useEffect
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

We can add additional functions too, but it is more concise to use the ready-made `render`.

`render()` can be called directly or passed in parameters, `render(callback, isLayoutEffect)`, judged by the second parameter, callback will be called in `useEffect` or `useLayoutEffect`. Note: In theory, `render` can be called multiple times(although this is incorrect), but React only triggers one update, so if callback is passed in each time, only the last callback will be take.

As a result, **we successfully lifted the dependency on `useEffect` and `useLayoutEffect`**.

Try it here: [codesandbox.io/s/react-split-components-3-zw6tk](https://codesandbox.io/s/react-split-components-3-zw6tk?file=/src/App.js)

**5. Implement the initial API request**

React components have a very basic requirement. Send API requests in didMount, but after Hooks unified didMount and didUpdate into `useEffect`, This requirement has one more step to understand.

Therefore, countless projects have implemented `useMount` by themselves. Hooks' original intention is to reuse, but for such a simple and basic requirement, it seems strange to install a lib, so countless people have implemented a `useMount` by themselves, which brings How much duplication of work, Hooks' original intention is "reuse".

In the above scheme, external variables (like `render`) have to be assigned after the component is rendered for the first time. This brings about a problem: `render` is only available after the first `useEffect` (that is, it is impossible to call `callback` in the first `useEffect`).

What about "useMount"? Here, we use the parameters of `useProps` to achieve this.

```jsx
const useProps = (props, onMount, isLayoutMount) => {
  // Omit other code...
  const onLayoutMountRef = useRef(isLayoutMount && onMount);
  const onMountRef = useRef(!isLayoutMount && onMount);

  useLayoutEffect(() => onLayoutMountRef.current?.(), []);
  useEffect(() => onMountRef.current?.(), []);

  // Omit other code...
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

That's it, try it here: [codesandbox.io/s/react-split-components-4-y8hn8](https://codesandbox.io/s/react-split-components-4-y8hn8?file=/src/App.js)

**6. Other Hooks**

So far, we have solved `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useLayoutEffect`, these are the most commonly used in development. There are 4 remaining official Hooks: `useContext`, `useReducer`, `useImperativeHandle`, `useDebugValue`, I will not deal with them one by one.

Make it simply: **If a variable can only be accessed inside component, needs to be use outside, pass it out by re-assignment**.

In this design mode, any existing requirement can be realized, so-called "abilities complete".

## 4. Introducing React Split Components (RiC)

Just like Higher-Order Components, this design pattern needs a name.

Considering that using closure splits "variables + logics" and "component code", learning the naming style of React Server Components, I named it **React Split Components**, which can be abbreviated as **RiC**, the small **`i`** here is a good expression of the "split" feature (Mainly after searching, I found that RSC, RPC, RLC, RTC are all occupied. Oh, the "split" has only 5 letters.).

Features of React Split Components:

**1. Remove the dependence on Hooks, but not previous pure Functional Components**

Through closure, no Hooks are required to wrap. This allows React developers to free themselves from the "counter-intuition of Functional Components" and "cumbersomeness of Hooks" and write pure JS intuitive code similar with Svelte.

After all, closure is a natural feature of JS.

**2. Adjust only at the writing level, without ESLint support**

In fact, when designing the implementation of `useEffect`, I thought of a way to use existing code: change `useEffect(fn, deps)` to `watch(deps, fn)`. But if like this, the `deps` of `watch` will need an ESLint plugin to support (because Hooks `deps` needs plugin support, otherwise it will easy to make mistakes).

If not necessary, do not add entities. We want to achieve as natural as possible, as simple as possible, as intuitive as possible. Turning `useMemo` into imperative programming is more intuitive, conforms to the habit of the Class Components, so the current implementation is the result of trade-offs.

**3. Similar to "High-Order Components", it is a "design pattern", not API, no library support**

It's not an official React API and does not need to be supported by building tools (such as React Server Components).

It does not need 3rd-party lib support (in fact, `useProps` can be encapsulated to a npm package, but considering that everyone has different habits and needs, you can implement the auxiliary function yourself, write it as one or separate, handle more cases, or use another name, the above code can be used as a reference).

React Split Components final code demo: [codesandbox.io/s/react-split-components-final-9ftjx](https://codesandbox.io/s/react-split-components-final-9ftjx?file=/src/App.js)

## 5. Hello, RiC

React Split Components (RiC) example:

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

How Svelte, how intuitive, how auto optimized performance and bye bye Hooks.
